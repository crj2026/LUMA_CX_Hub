import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    reasons: [
      { reason: "Too expensive",          count: 18, pct: 0.29 },
      { reason: "No longer needed",       count: 14, pct: 0.23 },
      { reason: "Pausing — travelling",   count: 11, pct: 0.18 },
      { reason: "Switching product",      count: 9,  pct: 0.15 },
      { reason: "Shipping too slow",      count: 6,  pct: 0.10 },
      { reason: "Other",                  count: 4,  pct: 0.06 },
    ],
    total: 62,
    fromCache: false,
  });
}
