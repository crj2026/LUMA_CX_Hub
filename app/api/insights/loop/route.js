import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Loop Returns data, last 7 days.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    returnsSubmitted: 60,
    returnsProcessed: 52,
    refundsIssued: 4800,
    exchangesProcessed: 18,
    topReturnReasons: [
      { reason: "Product not suitable for hair type", count: 23, pct: 0.38 },
      { reason: "Allergic reaction / sensitivity",    count: 14, pct: 0.24 },
      { reason: "No results seen yet",                count: 13, pct: 0.21 },
      { reason: "Received wrong item",                count: 6,  pct: 0.10 },
      { reason: "Other",                              count: 4,  pct: 0.07 },
    ],
    fromCache: false,
  });
}
