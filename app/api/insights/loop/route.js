import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    returnsSubmitted: 38,
    returnsProcessed: 31,
    refundsIssued: 23376,
    exchangesProcessed: 8,
    topReturnReasons: [
      { reason: "Damaged Item",  count: 14, pct: 0.37 },
      { reason: "Wrong Item",    count: 9,  pct: 0.24 },
      { reason: "Lost Package",  count: 7,  pct: 0.18 },
      { reason: "Changed Mind",  count: 5,  pct: 0.13 },
      { reason: "Other",         count: 3,  pct: 0.08 },
    ],
    fromCache: false,
  });
}
