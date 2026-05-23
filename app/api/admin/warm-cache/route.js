import { auth, currentUser } from "@clerk/nextjs/server";
import { getRole, roleAtLeast } from "../../../../lib/auth";
import { pruneExpiredCache } from "../../../../lib/cache";

export const runtime = "nodejs";
// Cron warming can take a while; let it run for up to 5 minutes.
export const maxDuration = 300;

// Compute the four common date ranges users hit on the Reports tab so the
// cache is hot when they open it. Sun-Sat is the team's reporting cadence.
function ranges() {
  const today = new Date();
  const ymd = (d) => d.toISOString().slice(0, 10);
  const todayY = ymd(today);

  // Current week: most recent Sunday → today
  const day = today.getDay();
  const lastSun = new Date(today);
  lastSun.setUTCDate(today.getUTCDate() - day);

  // Last completed week: previous Mon → previous Sun
  const lastSunCompleted = new Date(lastSun);
  lastSunCompleted.setUTCDate(lastSun.getUTCDate() - 1);
  const lastMon = new Date(lastSunCompleted);
  lastMon.setUTCDate(lastSunCompleted.getUTCDate() - 6);

  // Last 7 (rolling)
  const last7Start = new Date(today);
  last7Start.setUTCDate(today.getUTCDate() - 6);

  // MTD
  const mtdStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  return [
    { label: "current-week", from: ymd(lastSun),         to: todayY },
    { label: "last-week",    from: ymd(lastMon),         to: ymd(lastSunCompleted) },
    { label: "last-7",       from: ymd(last7Start),      to: todayY },
    { label: "mtd",          from: ymd(mtdStart),        to: todayY },
  ];
}

const ENDPOINTS = [
  "/api/insights/summary",
  "/api/insights/shopify",
  "/api/insights/loop",
  "/api/insights/skio",
  "/api/insights/skio/cancel-reasons",
  "/api/insights/trends",
];

async function warmOne(origin, path, fromIso, toIso, headers) {
  const url = `${origin}${path}?from=${fromIso}&to=${toIso}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { headers });
    const ms = Date.now() - start;
    return { url, status: res.status, ms, ok: res.ok };
  } catch (e) {
    return { url, status: 0, ms: Date.now() - start, ok: false, error: e.message };
  }
}

async function handle(req) {
  // Two ways to authenticate this endpoint:
  // 1. CRON_SECRET header — for scheduled triggers (Railway cron / external).
  // 2. Manager+ Clerk session — for ad-hoc manual warming from the hub.
  const cronSecret = req.headers.get("x-cron-secret");
  let viaCron = false;
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    viaCron = true;
  } else {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const user = await currentUser();
    const role = getRole(user);
    if (!roleAtLeast(role, "Manager")) {
      return Response.json({ error: "Forbidden — Manager role required" }, { status: 403 });
    }
  }

  const origin = new URL(req.url).origin;
  // Internal endpoints all require Clerk auth. Cron has no session — instead
  // it passes x-cron-secret which the routes' isCronRequest() check honours
  // as a bypass. Ad-hoc warming forwards the user's Clerk cookie.
  const headers = viaCron
    ? { "x-cron-secret": process.env.CRON_SECRET }
    : { cookie: req.headers.get("cookie") ?? "" };

  const ranges_ = ranges();
  const tasks = [];
  for (const r of ranges_) {
    const fromIso = new Date(r.from + "T00:00:00Z").toISOString();
    const toIso   = new Date(r.to   + "T23:59:59Z").toISOString();
    for (const path of ENDPOINTS) {
      tasks.push(warmOne(origin, path, fromIso, toIso, headers).then((res) => ({ ...res, range: r.label })));
    }
  }

  const results = await Promise.all(tasks);
  const pruned = await pruneExpiredCache();

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  return Response.json({
    runAt: new Date().toISOString(),
    viaCron,
    ranges: ranges_.map((r) => r.label),
    endpoints: ENDPOINTS.length,
    totalCalls: results.length,
    ok,
    failed,
    prunedExpiredCacheRows: pruned,
    results,
  });
}

export const GET  = handle;
export const POST = handle;
