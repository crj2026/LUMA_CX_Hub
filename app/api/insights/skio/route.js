import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Skio subscription data, last 7 days.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    activeSubscriptions: 8432,
    newSubscriptions: 312,
    churnedSubscriptions: 148,
    churnRate: 0.018,
    pausedSubscriptions: 612,
    failedPayments: 34,
    mrr: 750448,
    fromCache: false,
  });
}
