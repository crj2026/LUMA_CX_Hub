import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Gorgias ticket data, last 7 days.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    volume: 847,
    totalAcrossBrands: 847,
    csat: { average: 4.6, count: 312 },
    resolution: { avgSeconds: 2040, count: 724 },
    mpt: { avgSeconds: 7560, count: 724 },
    byChannel: { email: 482, chat: 241, instagram: 78, facebook: 46 },
    byStatus: { open: 41, pending: 82, closed: 724 },
    topTags: [
      { tag: "order-status-tracking",    count: 237 },
      { tag: "subscription-changes",     count: 186 },
      { tag: "product-questions",        count: 152 },
      { tag: "refund-requests",          count: 119 },
      { tag: "adverse-reactions",        count: 76  },
    ],
    fromCache: false,
  });
}
