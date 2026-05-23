import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Shopify order data, last 7 days.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    revenue: { gross: 233454, net: 225749, currency: "AUD" },
    orders: { total: 2847, refunded: 60, refundRate: 0.021, cancelled: 23 },
    refunds: { total: 4800, count: 60, avgRefund: 80 },
    aov: 82,
    topProducts: [
      { title: "Smooth Serum",                    revenue: 74712,  units: 946 },
      { title: "Repair Serum",                    revenue: 66130,  units: 778 },
      { title: "The Hair Edit (Subscription Box)", revenue: 54316,  units: 610 },
      { title: "Scalp Serum",                     revenue: 22757,  units: 256 },
      { title: "Glow Serum",                      revenue: 15539,  units: 207 },
    ],
    fromCache: false,
  });
}
