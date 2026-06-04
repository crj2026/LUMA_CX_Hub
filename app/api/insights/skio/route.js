import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// [BRAND_NAME] demo — Skio subscription data.
// Returns flat field names matching what the Insights and Reports
// components expect: skio.active, skio.paused, skio.churnRate,
// skio.cancelled, skio.created, skio.netChange, skio.failedPayments, etc.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    active:           8432,
    paused:           612,
    activeAtStart:    8268,
    churnRate:        0.018,
    cancelled:        148,
    created:          312,
    netChange:        164,    // created - cancelled
    failedPayments:   34,
    mrr:              750448,
    fromCache: false,
  });
}
