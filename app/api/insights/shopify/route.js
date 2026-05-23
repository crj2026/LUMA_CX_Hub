import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Shopify order data.
// Returns flat field names matching what the Insights and Reports
// components expect: shop.orders (number), shop.refunded, shop.refundRate,
// shop.refundRateDollars, shop.cancelRate, shop.cancelled, etc.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    orders:             2847,
    refunded:           60,
    fullyRefunded:      44,
    partiallyRefunded:  16,
    refundRate:         0.021,           // 6.0% by count
    refundRateDollars:  0.021,           // 2.1% by $ (AUD)
    refundAmount:       4800,            // AUD
    cancelled:          23,
    cancelRate:         0.008,
    revenue:            233454,
    aov:                82,
    topProducts: [
      { title: "Smooth Serum",                    revenue: 74712,  units: 946 },
      { title: "Repair Serum",                    revenue: 66130,  units: 778 },
      { title: "The Hair Edit (Subscription Box)", revenue: 54316, units: 610 },
      { title: "Scalp Serum",                     revenue: 22757,  units: 256 },
      { title: "Glow Serum",                      revenue: 15539,  units: 207 },
    ],
    fromCache: false,
  });
}
