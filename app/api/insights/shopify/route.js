import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// [BRAND_NAME] demo — Shopify order data.
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
      { title: "[Product 1]", revenue: 74712, units: 946 },
      { title: "[Product 2]", revenue: 66130, units: 778 },
      { title: "[Product 3]", revenue: 54316, units: 610 },
      { title: "[Product 4]", revenue: 22757, units: 256 },
      { title: "[Product 5]", revenue: 15539, units: 207 },
    ],
    fromCache: false,
  });
}
