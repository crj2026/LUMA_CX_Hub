import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    revenue: { gross: 284700, net: 261324, currency: "USD" },
    orders: { total: 1847, refunded: 38, refundRate: 0.0206 },
    refunds: { total: 23376, count: 38, avgRefund: 615 },
    aov: 154.2,
    topProducts: [
      { title: "[Client Product A]", revenue: 142350, units: 923 },
      { title: "[Client Product B]", revenue: 98420, units: 547 },
      { title: "[Client Product C]", revenue: 43930, units: 377 },
    ],
    fromCache: false,
  });
}
