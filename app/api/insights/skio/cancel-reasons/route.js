import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// [BRAND_NAME] demo — subscription cancellation reasons.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    reasons: [
      { reason: "[Cancel reason 1 — e.g. Too expensive]", count: 62, pct: 0.42 },
      { reason: "[Cancel reason 2 — e.g. Wrong product fit]", count: 34, pct: 0.23 },
      { reason: "[Cancel reason 3 — e.g. Using too slowly]", count: 22, pct: 0.15 },
      { reason: "[Cancel reason 4 — e.g. No results yet]", count: 15, pct: 0.10 },
      { reason: "[Cancel reason 5 — e.g. Switching products]", count: 9,  pct: 0.06 },
      { reason: "[Cancel reason 6 — e.g. Personal / life change]", count: 6,  pct: 0.04 },
    ],
    total: 148,
    fromCache: false,
  });
}
