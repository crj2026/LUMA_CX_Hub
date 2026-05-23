import { auth, currentUser } from "@clerk/nextjs/server";
import { fetchReturns, loopAvailable, LOOP_DATA_START } from "../../../../lib/loop";
import { cached } from "../../../../lib/cache";
import { getRole, roleAtLeast, isCronRequest } from "../../../../lib/auth";

export const runtime = "nodejs";

const TTL_MS = 60 * 60 * 1000;

function parseRange(searchParams) {
  const to = searchParams.get("to") || new Date().toISOString();
  const from =
    searchParams.get("from") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

// Loop's actual response shape (verified via probe):
// state ∈ {open, closed, cancelled, ...}, outcome ∈ {refund, exchange,
// gift_card, ...}, r.refund is a string-numeric refund amount.
// A return counts as an issued refund only when it CLOSED with a refund
// outcome and a non-zero refund amount.
function isRefund(r) {
  const state = String(r.state ?? "").toLowerCase();
  if (state !== "closed") return false;
  if (String(r.outcome ?? "").toLowerCase() !== "refund") return false;
  return Number(r.refund) > 0;
}

function refundAmount(r) {
  return Number(r.refund) || 0;
}

function refundDate(r) {
  return r.outcomes_processed_at?.refund_processed ?? r.updated_at ?? r.created_at ?? null;
}

// Loop's response doesn't include the original order date — we'd need to
// enrich from Shopify by order_name to compute days-since-purchase. Until
// then, leave window as "unknown" so Total $ / count / reasons stay correct
// and the matrix renders everything in the Unknown row.
function orderCreatedAt(_r) {
  return null;
}

// Bucket each refund by product subscription cadence rather than days since
// order — Loop doesn't return the original order date, but the line-item
// title encodes the cadence we care about. Priority-ordered match so
// "Quarterly Refills" lands in Quarterly (not Refills), and "30 days
// refills" lands in Monthly (not Refills).
function productCategory(r) {
  const lines = r.line_items ?? [];
  const titles = lines
    .map((li) => li.title ?? li.name ?? li.product_title ?? li.product_name ?? "")
    .filter(Boolean);
  const title = (titles[0] || "").toLowerCase();
  if (!title) return "OTP";
  if (title.includes("quarterly") || title.includes("90 day")) return "Quarterly";
  if (title.includes("30 day") || title.includes("monthly") || title.includes("double subscription")) return "Monthly";
  if (title.includes("refill")) return "Refills";
  return "OTP";
}

// Loop stores the customer-selected refund reason on each line item, not
// at the return level — and the field name varies across stores. Try the
// common paths defensively and only fall back to "Other" if nothing fits.
function reasonsFromReturn(r) {
  const lines = r.line_items ?? [];
  const out = [];
  for (const li of lines) {
    const candidates = [
      li.reason?.name,
      li.reason?.label,
      li.reason?.title,
      li.return_reason?.name,
      li.return_reason?.label,
      typeof li.reason === "string" ? li.reason : null,
      typeof li.return_reason === "string" ? li.return_reason : null,
      li.return_reason_name,
      li.reason_name,
      li.policy_reason?.name,
    ];
    const found = candidates.find((c) => typeof c === "string" && c.trim().length > 0);
    if (found) out.push(found.trim());
  }
  return out;
}

const CATEGORIES = ["Quarterly", "Monthly", "Refills", "OTP"];

// Operations metrics for the weekly report — separate from refund-$ math.
// Walks every return in the window (not just the refund-outcome subset)
// because Cherie's weekly summary covers volume / processed / labels /
// handling fees regardless of whether each return ended in a refund.
//
// Field names confirmed against Loop's live API on 2026-05-15 via
// Desktop/diagnose-loop-operations.js — see top-level fields:
//   was_processed, state ∈ {open, closed, cancelled},
//   label_url (null when no label issued), handling_fee (numeric string),
//   refund_before_inspection (the "keep-item" flag).
//
// Numbers will not exactly match Loop's dashboard "Last week" view —
// Loop's UI uses a different (undisclosed) window definition. Our values
// are internally consistent with the rest of the weekly report.
function computeOperations(returns) {
  let submitted = 0;
  let processed = 0;
  let openState = 0;
  let closedState = 0;
  let cancelledState = 0;
  let otherState = 0;
  let labelsGenerated = 0;
  let handlingFeesTotal = 0;
  let keepItemCount = 0;
  let refundBeforeInspectionCount = 0;

  for (const r of returns) {
    submitted += 1;
    const state = String(r.state ?? "").toLowerCase();
    if (state === "open") openState += 1;
    else if (state === "closed") { closedState += 1; processed += 1; }
    else if (state === "cancelled") cancelledState += 1;
    else otherState += 1;

    const hasLabel = !!(r.label_url && r.label_url !== "");
    if (hasLabel) labelsGenerated += 1;

    // True keep-item = customer was refunded WITHOUT having to ship
    // anything back. Operationally this means: no shipping label was
    // ever generated AND the return wasn't cancelled.
    //
    // Previously we (incorrectly) used `refund_before_inspection=true`
    // for keep-item, but that flag only means "refund issued before
    // warehouse inspection" — a label can still be generated for those
    // returns. Caught on 2026-05-15 when the keep-item % said 100% on a
    // window where 30 labels were generated. We track the original flag
    // as refundBeforeInspectionCount for visibility but it's no longer
    // the headline number.
    if (!hasLabel && state !== "cancelled") keepItemCount += 1;
    if (r.refund_before_inspection === true) refundBeforeInspectionCount += 1;

    const fee = Number(r.handling_fee);
    if (Number.isFinite(fee)) handlingFeesTotal += fee;
  }

  // `processed` now mirrors the Refunds section's isRefund() predicate
  // domain (state=closed). The previous `was_processed=true` flag lags
  // by hours behind state=closed in Loop's data, so the two sections
  // disagreed by ~2 returns at any given time. Using state=closed makes
  // both sections show the same headline count.

  const round3 = (n) => Math.round(n * 1000) / 1000;
  return {
    submitted,
    processed,
    processedRate: submitted > 0 ? round3(processed / submitted) : 0,
    byState: {
      open: openState,
      closed: closedState,
      cancelled: cancelledState,
      other: otherState,
    },
    labelsGenerated,
    handlingFeesTotal: Math.round(handlingFeesTotal * 100) / 100,
    keepItemCount,
    keepItemRate: submitted > 0 ? round3(keepItemCount / submitted) : 0,
    refundBeforeInspectionCount, // diagnostic only — not for headline display
  };
}

function compute(returns) {
  const refunds = returns.filter(isRefund);
  const total = refunds.reduce((s, r) => s + refundAmount(r), 0);

  const matrix = {};
  for (const c of CATEGORIES) matrix[c] = { count: 0, amount: 0 };

  // Per reason: count of returns AND sum of refund $. A single return can
  // have multiple reasons (line items reasons differ); each reason gets
  // attributed the full refund amount so per-reason $ may sum to MORE
  // than the total refund $. This matches how Shopify/Loop typically
  // present reason analytics — each row tells "how big is this category".
  const reasonCounts = {};
  const reasonAmounts = {};
  for (const r of refunds) {
    const c = productCategory(r);
    matrix[c].count += 1;
    matrix[c].amount += refundAmount(r);
    const seenReasonsForThisReturn = new Set();
    for (const reason of reasonsFromReturn(r)) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      // Only attribute $ once per return per reason (a return with two
      // line items both labeled "wrong size" should count $ once for
      // "wrong size", not twice).
      if (!seenReasonsForThisReturn.has(reason)) {
        seenReasonsForThisReturn.add(reason);
        reasonAmounts[reason] = (reasonAmounts[reason] || 0) + refundAmount(r);
      }
    }
  }

  // Top 25 — categorisation in the UI needs the long tail to bucket well.
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([reason, count]) => ({
      reason,
      count,
      amount: Math.round((reasonAmounts[reason] || 0) * 100) / 100,
    }));

  return {
    total: Math.round(total * 100) / 100,
    count: refunds.length,
    matrix,
    topReasons,
    operations: computeOperations(returns),
    cutoff: LOOP_DATA_START,
  };
}

export async function GET(req) {
  if (!isCronRequest(req)) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const user = await currentUser();
    const role = getRole(user);
    if (!roleAtLeast(role, "Lead Agent")) {
      return Response.json({ error: "Forbidden — Lead Agent role required" }, { status: 403 });
    }
  }
  if (!loopAvailable()) {
    return Response.json({ error: "Loop credentials missing: set LOOP_API_KEY" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(searchParams);

  try {
    // v4 = fixes two operations-section bugs found on 2026-05-15:
    //   (1) `processed` now uses state=closed instead of was_processed flag,
    //       so it agrees with the Refunds section's "X via Loop" count.
    //   (2) `keepItemCount` now means "no label generated AND not cancelled"
    //       — previously used refund_before_inspection which caused 100%
    //       keep-item readings on windows with 30+ labels generated.
    // Cache bump invalidates the buggy v3 entries.
    const { value, fromCache } = await cached(
      `loop-v4:${from}:${to}`,
      TTL_MS,
      async () => compute(await fetchReturns({ from, to }))
    );
    return Response.json({ ...value, from, to, fromCache });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
