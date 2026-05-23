import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Hair Edit subscription cancellation reasons.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    reasons: [
      { reason: "Too expensive",              count: 62, pct: 0.42 },
      { reason: "Wrong serums / bad curation",count: 34, pct: 0.23 },
      { reason: "Not using fast enough",      count: 22, pct: 0.15 },
      { reason: "No results seen yet",        count: 15, pct: 0.10 },
      { reason: "Switching products",         count: 9,  pct: 0.06 },
      { reason: "Personal / life change",     count: 6,  pct: 0.04 },
    ],
    total: 148,
    fromCache: false,
  });
}
