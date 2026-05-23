import { auth } from "@clerk/nextjs/server";
import { skioConfig, skioGraphQL } from "../../../../lib/skio";
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

// Skio's Hasura schema doesn't expose _aggregate variants, so we use
// their getDailyRevenueMetrics query — a Skio-built rollup that returns
// daily counts of active / paused / cancelled / failed subscriptions
// plus first-time subscribers. We sum events across the range and use
// the latest day for current-state snapshots.
const QUERY = `
  query SkioInsights($input: DailyRevenueMetricsInput!) {
    getDailyRevenueMetrics(input: $input) {
      revenueMetrics {
        date
        siteId
        activeSubscriptionsCount
        pausedSubscriptionsCount
        cancelledSubscriptionsCount
        failedSubscriptionsCount
        firstTimeSubscribers
      }
    }
  }
`;

// Cancel reasons live at /api/insights/skio/cancel-reasons — that endpoint
// paginates V3Session.pathTaken and is slow on cache miss. The frontend
// fetches it independently so this route can return fast.
const ymd = (iso) => new Date(iso).toISOString().slice(0, 10);

// Skio's *Count fields are cumulative state snapshots (subs currently in
// that status), not per-day events. To get events in range, take the
// delta between the day BEFORE the range and the last day of the range.
// firstTimeSubscribers is a true per-day event count, so we sum it.
async function compute(from, to) {
  const { siteId } = skioConfig();
  if (!siteId) {
    throw new Error("Skio site missing: set SKIO_SITE_ID");
  }

  const dayBefore = new Date(new Date(from).getTime() - 86400000);
  const data = await skioGraphQL(QUERY, {
    input: { dateStart: ymd(dayBefore), dateEnd: ymd(to) },
  });

  const all = (data?.getDailyRevenueMetrics?.revenueMetrics ?? [])
    .filter((r) => !r.siteId || r.siteId === siteId)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  if (!all.length) {
    return {
      active: null, paused: null, cancelled: 0, created: 0,
      netChange: 0, failedPayments: 0, activeAtStart: null,
      churnRate: null,
    };
  }

  const fromYmd = ymd(from);
  const baselineIdx = all.findIndex((r) => (r.date ?? "") >= fromYmd) - 1;
  const baseline = baselineIdx >= 0 ? all[baselineIdx] : all[0];
  const inRange = all.filter((r) => (r.date ?? "") >= fromYmd);
  const last = inRange[inRange.length - 1] ?? all[all.length - 1];

  const active = last.activeSubscriptionsCount ?? null;
  const paused = last.pausedSubscriptionsCount ?? null;
  const activeAtStart = baseline.activeSubscriptionsCount ?? null;

  const delta = (key) => {
    const a = Number(last[key]);
    const b = Number(baseline[key]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.max(0, a - b);
  };
  const cancelled = delta("cancelledSubscriptionsCount");
  const failed = delta("failedSubscriptionsCount");
  const created = inRange.reduce((s, r) => s + (Number(r.firstTimeSubscribers) || 0), 0);

  const churnRate = activeAtStart && activeAtStart > 0 ? cancelled / activeAtStart : null;

  return {
    active,
    paused,
    cancelled,
    created,
    netChange: created - cancelled,
    failedPayments: failed,
    activeAtStart,
    churnRate: churnRate != null ? Math.round(churnRate * 10000) / 10000 : null,
  };
}

export async function GET(req) {
  if (!isCronRequest(req)) {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(searchParams);

  try {
    const { value, fromCache } = await cached(
      `skio:${from}:${to}`,
      TTL_MS,
      () => compute(from, to)
    );
    return Response.json({ ...value, from, to, fromCache });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
