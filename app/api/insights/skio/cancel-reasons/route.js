import { auth } from "@clerk/nextjs/server";
import { skioConfig, skioGraphQL } from "../../../../../lib/skio";
import { cached } from "../../../../../lib/cache";
import { isCronRequest } from "../../../../../lib/auth";

export const runtime = "nodejs";

const TTL_MS = 60 * 60 * 1000;

function parseRange(searchParams) {
  const to = searchParams.get("to") || new Date().toISOString();
  const from =
    searchParams.get("from") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

const QUERY = `
  query SkioCancelReasons($siteId: uuid!, $from: timestamptz!, $to: timestamptz!, $limit: Int!, $offset: Int!) {
    CancelFlowV3Session(
      where: { siteId: {_eq: $siteId}, createdAt: {_gte: $from, _lte: $to} },
      order_by: { createdAt: desc },
      limit: $limit,
      offset: $offset
    ) {
      id pathTaken status
    }
  }
`;

function extractReason(pathTaken) {
  if (!Array.isArray(pathTaken)) return null;
  const step = pathTaken.find((s) => s?.type === "cf_v3_reason");
  return step?.actionMetaData?.reason ?? null;
}

// Normalize reason text so trivial variants (smart quotes, punctuation,
// "I have" vs "I've") collapse into one bucket. Keeps the most common
// original spelling for display.
function normalizeReason(text) {
  return String(text)
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/i've/g, "i have")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function compute(from, to) {
  const { siteId } = skioConfig();
  if (!siteId) throw new Error("Skio site missing: set SKIO_SITE_ID");

  const PAGE = 1000;
  const MAX_PAGES = 50;
  const sessions = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const data = await skioGraphQL(QUERY, {
      siteId,
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
      limit: PAGE,
      offset: i * PAGE,
    });
    const rows = data?.CancelFlowV3Session ?? [];
    sessions.push(...rows);
    if (rows.length < PAGE) break;
  }

  const counts = {};
  const display = {};
  const displaySpelling = {};
  let totalCancelled = 0;
  for (const s of sessions) {
    if (s.status !== "CANCELLED") continue;
    totalCancelled += 1;
    const reason = extractReason(s.pathTaken);
    if (!reason) continue;
    const norm = normalizeReason(reason);
    counts[norm] = (counts[norm] || 0) + 1;
    // Track each original spelling so we can pick the most common one
    if (!display[norm]) display[norm] = {};
    display[norm][reason] = (display[norm][reason] || 0) + 1;
  }
  // For each normalized reason, pick the spelling with the highest count
  for (const norm of Object.keys(display)) {
    let best = null, bestCount = -1;
    for (const [spelling, n] of Object.entries(display[norm])) {
      if (n > bestCount) { best = spelling; bestCount = n; }
    }
    displaySpelling[norm] = best;
  }

  // Top 25 — the combined Refund/Cancel Reasons panel buckets free-text
  // reasons into categories, so we need the long tail to bucket well.
  const topCancelReasons = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([norm, count]) => ({ reason: displaySpelling[norm], count }));

  return { topCancelReasons, totalCancelled, totalSessions: sessions.length };
}

export async function GET(req) {
  if (!isCronRequest(req)) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(searchParams);

  try {
    // v2 = top-25 (was top-10) so categorisation in the UI works properly
    const { value, fromCache } = await cached(`skio-cancel-reasons-v2:${from}:${to}`, TTL_MS, () => compute(from, to));
    return Response.json({ ...value, from, to, fromCache });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
