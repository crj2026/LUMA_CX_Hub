import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Returns & Refunds data, shaped to match the Insights
// LoopRefundsCard + RefundCancelReasonsPanel component contracts.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    // Total volume
    count: 60,
    total: 4800,   // AUD

    // Breakdown by subscription type (used by LoopRefundsCard table)
    matrix: {
      Monthly:   { count: 32, amount: 2560 },   // Hair Edit subscribers (monthly)
      Bimonthly: { count: 12, amount: 960  },   // Skip-month / bi-monthly
      Refills:   { count: 10, amount: 800  },   // Renewal orders
      OTP:       { count: 6,  amount: 480  },   // One-time purchases
    },

    // Top return reasons (used by RefundCancelReasonsPanel)
    topReasons: [
      { reason: "Product not suitable for hair type", count: 23, amount: 1840 },
      { reason: "Allergic reaction / sensitivity",    count: 14, amount: 1120 },
      { reason: "No results seen yet",                count: 13, amount: 1040 },
      { reason: "Received wrong item",                count: 6,  amount: 480  },
      { reason: "Other",                              count: 4,  amount: 320  },
    ],

    // Operations detail (used by LoopOperationsBlock — archived in this build)
    operations: {
      submitted:       60,
      approved:        52,
      rejected:        8,
      restockedCount:  44,
      handlingFeesTotal: 0,
    },

    fromCache: false,
  });
}
