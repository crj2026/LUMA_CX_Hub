import { auth } from "@clerk/nextjs/server";
// parseNextPageInfo dropped May 17 — refund pagination moved off REST link
// headers and onto GraphQL cursors. shopifyFetch retained for countOrders.
import { shopifyFetch, shopifyGraphQL } from "../../../../lib/shopify";
import { cached } from "../../../../lib/cache";
import { isCronRequest } from "../../../../lib/auth";

export const runtime = "nodejs";

const TTL_MS = 60 * 60 * 1000;

function parseRange(searchParams) {
  const to = searchParams.get("to") || new Date().toISOString();
  const from =
    searchParams.get("from") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

async function countOrders(extraParams, fromIso, toIso) {
  const params = new URLSearchParams({
    status: "any",
    created_at_min: fromIso,
    created_at_max: toIso,
    ...extraParams,
  });
  const { body } = await shopifyFetch(`/orders/count.json?${params}`);
  return Number(body?.count ?? 0);
}

const SHOPIFYQL = `
  query GetSums($q: String!) {
    shopifyqlQuery(query: $q) {
      __typename
      ... on TableResponse {
        tableData {
          columns { name dataType }
          rowData
          unformattedData
        }
      }
      ... on ParseError {
        code
        message
      }
    }
  }
`;

function ymd(iso) {
  return iso.slice(0, 10);
}

async function fetchSums(fromIso, toIso) {
  const fromDay = ymd(fromIso);
  const toDay = ymd(toIso);
  const q =
    `FROM sales ` +
    `SHOW gross_sales, discounts, returns, net_sales, total_sales ` +
    `WHERE created_at_date >= '${fromDay}' AND created_at_date <= '${toDay}'`;

  try {
    const data = await shopifyGraphQL(SHOPIFYQL, { q });
    const result = data?.shopifyqlQuery;
    if (result?.__typename === "TableResponse") {
      const rows = result.tableData?.unformattedData ?? result.tableData?.rowData ?? [];
      const totals = (rows[0] ?? []).map(Number);
      const cols = (result.tableData?.columns ?? []).map((c) => c.name);
      const out = {};
      for (let i = 0; i < cols.length; i++) {
        if (Number.isFinite(totals[i])) out[cols[i]] = totals[i];
      }
      return { ok: true, ...out };
    }
    return { ok: false, error: result?.message || result?.__typename || "unknown" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// GraphQL refund query — swapped in May 17 to fix multi-currency under-counting.
// Earlier REST path read tx.amount_set.shop_money.amount which Shopify returns
// as `undefined` for foreign-currency Shopify Payments transactions (IDR, KRW).
// We had to skip those txs, which dropped 79 refunds worth ~$21K USD from the
// May 10-16 weekly report — Shopify dashboard showed $36,403 vs hub $15,421.
//
// GraphQL Admin API reliably populates `amountSet.shopMoney.amount` for ALL
// currencies (Shopify normalises into the shop's primary currency on its
// side), so by sourcing the same logic from GraphQL we get the foreign
// refunds back without re-introducing the April IDR-as-USD inflation bug.
//
// Exclusion rules preserved 1:1 from the REST path:
//   - kind === "REFUND" only (skip authorization/sale/etc)
//   - status === "SUCCESS" only
//   - gateway != gift_card / store_credit (store credit isn't cash leaving)
const REFUNDS_QUERY = `
  query GetRefundedOrders($q: String!, $cursor: String) {
    orders(first: 100, query: $q, after: $cursor, sortKey: UPDATED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        name
        displayFinancialStatus
        refunds {
          id
          createdAt
          transactions(first: 50) {
            edges {
              node {
                id
                kind
                status
                gateway
                amountSet { shopMoney { amount currencyCode } }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchRefundsInWindow(fromIso, toIso) {
  let amount = 0;
  let events = 0;
  let fullCount = 0;
  let partialCount = 0;
  // Diagnostics — what's getting filtered out and which gateways we saw.
  // Surfaced through to _debug so we can verify the hypothesis without
  // server logs.
  let giftCardAmount = 0;
  let giftCardEvents = 0;
  let allKindRefundAmount = 0;
  // Per-status totals — to test the hypothesis that Shopify's dashboard
  // shows fully-refunded amounts only and our $30K gap is partial refunds.
  let fullRefundAmount = 0;
  let partialRefundAmount = 0;
  // Multi-currency safety. Some IM8 customers pay in their local currency
  // via Shopify Payments multi-currency (e.g., IDR, KRW). For those txs,
  // `tx.amount` is the raw foreign-currency number (e.g., 4,884,000 IDR ≈
  // $300 USD) and `tx.amount_set.shop_money` comes back undefined in the
  // embedded-on-orders refund payload. Without a guard, we sum 4,884,000
  // as USD and a single IDR refund inflates the monthly total by $4.8M.
  // Diagnosed by /Users/cherie/Desktop/diagnose-refunds.js on May 14 —
  // 7 IDR/KRW refunds in April summed to $15.77M of fake "refunds".
  // Kept for parity with the old REST path — expected to stay at 0 now
  // that we're sourcing from GraphQL (which always populates shopMoney).
  // If this ever climbs, it means Shopify's GraphQL also stopped
  // normalising for some currency — alert and investigate.
  let skippedForeignTxCount = 0;
  let skippedForeignTxRaw = 0;
  const gatewayBreakdown = {}; // gateway -> { count, amount }
  const orderIds = new Set();
  const fromMs = new Date(fromIso).getTime();
  const toMs = new Date(toIso).getTime();
  const MAX_PAGES = 60;

  // Build the Shopify search query. Updated-at window + only orders with
  // refunds attached. We deliberately do NOT filter by financial_status
  // here — partially-refunded orders with refunds in-window must be
  // included, and Shopify's `query` syntax for OR'd statuses is brittle.
  // We bucket fully vs partially by reading displayFinancialStatus per node.
  const q = `updated_at:>='${fromIso}' updated_at:<='${toIso}' (financial_status:refunded OR financial_status:partially_refunded)`;

  let cursor = null;
  let pageIdx = 0;
  do {
    const data = await shopifyGraphQL(REFUNDS_QUERY, { q, cursor });
    const orders = data?.orders?.nodes ?? [];
    const pageInfo = data?.orders?.pageInfo ?? {};

    for (const order of orders) {
      let orderHadRefundInWindow = false;
      let orderRefundAmount = 0;
      const orderRefunds = order.refunds ?? [];
      for (const refund of orderRefunds) {
        const refundMs = new Date(refund.createdAt).getTime();
        if (!Number.isFinite(refundMs) || refundMs < fromMs || refundMs > toMs) continue;
        orderHadRefundInWindow = true;
        const txEdges = refund.transactions?.edges ?? [];
        for (const { node: tx } of txEdges) {
          // GraphQL enums come back upper-case (REFUND, SUCCESS) — match
          // case-insensitively to keep parity with the old REST path.
          if (String(tx.kind || "").toUpperCase() !== "REFUND") continue;
          if (String(tx.status || "").toUpperCase() !== "SUCCESS") continue;

          // GraphQL `amountSet.shopMoney.amount` is ALWAYS USD-normalised
          // for IM8 (shop currency = USD), regardless of customer's
          // payment currency. This is the field REST was supposed to
          // populate but didn't for IDR/KRW — the multi-currency gap
          // diagnosed May 17 (79 foreign-currency refunds = $21K USD
          // missing from the May 10-16 weekly report).
          const txValue = Number(tx.amountSet?.shopMoney?.amount);
          if (!Number.isFinite(txValue)) {
            // Shouldn't happen on GraphQL, but if it does, count it
            // so we can see the regression in diag rather than silently
            // dropping value.
            skippedForeignTxCount += 1;
            continue;
          }

          // Track everything for the diagnostic payload regardless of
          // filter outcome (mirrors the REST path).
          allKindRefundAmount += txValue;
          const gateway = String(tx.gateway || "unknown").toLowerCase();
          if (!gatewayBreakdown[gateway]) gatewayBreakdown[gateway] = { count: 0, amount: 0 };
          gatewayBreakdown[gateway].count += 1;
          gatewayBreakdown[gateway].amount = Math.round((gatewayBreakdown[gateway].amount + txValue) * 100) / 100;

          // Exclude gift_card / store_credit — store credit, not cash
          // leaving the business. Shopify's dashboard excludes them too.
          if (gateway === "gift_card" || gateway === "store_credit") {
            giftCardAmount += txValue;
            giftCardEvents += 1;
            continue;
          }

          amount += txValue;
          orderRefundAmount += txValue;
          events += 1;
        }
      }
      if (orderHadRefundInWindow && !orderIds.has(order.id)) {
        orderIds.add(order.id);
        const fs = String(order.displayFinancialStatus || "").toUpperCase();
        if (fs === "REFUNDED") {
          fullCount += 1;
          fullRefundAmount += orderRefundAmount;
        } else if (fs === "PARTIALLY_REFUNDED") {
          partialCount += 1;
          partialRefundAmount += orderRefundAmount;
        }
      }
    }

    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    pageIdx += 1;
  } while (cursor && pageIdx < MAX_PAGES);
  return {
    amount,
    events,
    orderCount: orderIds.size,
    fullCount,
    partialCount,
    // Diagnostics so we can compare against Shopify's dashboard:
    diag: {
      allKindRefundAmount: Math.round(allKindRefundAmount * 100) / 100,
      giftCardAmount: Math.round(giftCardAmount * 100) / 100,
      giftCardEvents,
      gatewayBreakdown,
      fullRefundAmount: Math.round(fullRefundAmount * 100) / 100,
      partialRefundAmount: Math.round(partialRefundAmount * 100) / 100,
      // Multi-currency safety counters — how many txs we skipped because
      // they were in foreign currency with no shop_money normalisation.
      // Raw sum is for visibility only (it's foreign-currency face value,
      // not USD).
      skippedForeignTxCount,
      skippedForeignTxRaw: Math.round(skippedForeignTxRaw * 100) / 100,
    },
  };
}

async function compute(from, to) {
  const [total, cancelled, refundsInWindow, sums] = await Promise.all([
    countOrders({}, from, to),
    countOrders({ status: "cancelled" }, from, to),
    fetchRefundsInWindow(from, to).catch((e) => ({ error: e.message })),
    fetchSums(from, to).catch((e) => ({ ok: false, error: e.message })),
  ]);

  const refundOrderCount = refundsInWindow?.orderCount ?? 0;
  // Count-based rate: refunded orders ÷ all orders. Useful for CS volume
  // planning ("how many cases land on the team"). Always gross-based —
  // dividing by net would be the same denominator only minus refunded
  // orders and isn't a standard ecommerce metric.
  const refundRate = total ? refundOrderCount / total : 0;
  const cancelRate = total ? cancelled / total : 0;

  // Headline refund amount: prefer ShopifyQL's `returns` aggregate (the
  // exact figure Shopify's own dashboard shows as "Total refund amount").
  // Falls back to summed transaction amounts only if ShopifyQL fails.
  // Per-order transaction summing was over-counting vs Shopify's dashboard
  // (~60% high on Cherie's May 2-8 test) — likely due to shipping/tax
  // refunds, gift-card "refund" transactions, or methodology mismatch.
  const shopifyqlReturns = sums?.ok && Number.isFinite(sums.returns)
    ? Math.abs(sums.returns)  // ShopifyQL returns this as a negative
    : null;
  const transactionRefundAmount = refundsInWindow?.error
    ? null
    : Math.round((refundsInWindow?.amount ?? 0) * 100) / 100;
  const refundAmount = shopifyqlReturns != null
    ? Math.round(shopifyqlReturns * 100) / 100
    : transactionRefundAmount;

  // $-based rate: refund $ ÷ gross sales $. The standard ecommerce/DTC
  // refund rate metric — what fraction of revenue came back. Industry
  // benchmark for supplements is ~5-12%. Always gross-based, matching
  // Shopify's own reporting convention.
  const grossSales = sums?.ok && Number.isFinite(sums.gross_sales) ? sums.gross_sales : null;
  const refundRateDollars = grossSales && grossSales > 0 && refundAmount != null
    ? refundAmount / grossSales
    : null;

  return {
    orders: total,
    refunded: refundOrderCount,
    fullyRefunded: refundsInWindow?.fullCount ?? 0,
    partiallyRefunded: refundsInWindow?.partialCount ?? 0,
    cancelled,
    refundRate: Math.round(refundRate * 10000) / 10000,
    refundRateDollars: refundRateDollars != null
      ? Math.round(refundRateDollars * 10000) / 10000
      : null,
    cancelRate: Math.round(cancelRate * 10000) / 10000,
    refundAmount,
    // Debug: which source did refundAmount come from, and what's
    // each individual source's value? Surface in the API response so
    // we can diagnose without server logs.
    _debug: {
      refundSource: shopifyqlReturns != null ? "shopifyql.returns" : (transactionRefundAmount != null ? "transactionSum" : "none"),
      shopifyqlReturns,
      transactionSum: transactionRefundAmount,
      // Transaction-level diagnostics — should expose any gift_card /
      // store_credit refunds that were being counted as cash before.
      allKindRefundAmount: refundsInWindow?.diag?.allKindRefundAmount ?? null,
      giftCardAmount: refundsInWindow?.diag?.giftCardAmount ?? null,
      giftCardEvents: refundsInWindow?.diag?.giftCardEvents ?? null,
      gatewayBreakdown: refundsInWindow?.diag?.gatewayBreakdown ?? null,
      fullRefundAmount: refundsInWindow?.diag?.fullRefundAmount ?? null,
      partialRefundAmount: refundsInWindow?.diag?.partialRefundAmount ?? null,
      skippedForeignTxCount: refundsInWindow?.diag?.skippedForeignTxCount ?? null,
      skippedForeignTxRaw: refundsInWindow?.diag?.skippedForeignTxRaw ?? null,
      sumsOk: sums?.ok ?? false,
      sumsKeys: sums?.ok ? Object.keys(sums) : [],
      sumsError: sums?.error ?? null,
    },
    grossSales: grossSales != null ? Math.round(grossSales * 100) / 100 : null,
    refundEvents: refundsInWindow?.events ?? 0,
    refundError: refundsInWindow?.error ?? null,
  };
}

export async function GET(req) {
  if (!isCronRequest(req)) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(searchParams);
  try {
    // v9 = GraphQL refund path. v8 skipped foreign-currency refund txs
    // entirely (because REST returned undefined shopMoney). That left
    // 79 refunds = $20,982 USD missing from the May 10-16 weekly report
    // (Shopify dashboard $36,403 vs hub $15,421). GraphQL Admin reliably
    // populates amountSet.shopMoney.amount across all currencies, so v9
    // captures the foreign refunds correctly without re-introducing the
    // April IDR-as-USD $15.77M inflation bug. Bump invalidates stale v8
    // entries so the fix is visible immediately.
    const { value, fromCache } = await cached(`shopify-v9:${from}:${to}`, TTL_MS, () => compute(from, to));
    return Response.json({ ...value, from, to, fromCache });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
