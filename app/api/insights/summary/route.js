import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Demo mock — returns realistic DTC numbers for the Luma CX sales demo.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    volume: 47,
    totalAcrossBrands: 47,
    csat: { average: 4.82, count: 31 },
    resolution: { avgSeconds: 2340, count: 39 },
    mpt: { avgSeconds: 1200, count: 39 },
    byChannel: { email: 28, chat: 12, instagram: 4, facebook: 3 },
    byStatus: { open: 8, pending: 6, closed: 33 },
    topTags: [
      { tag: "shipping-delay", count: 9 },
      { tag: "subscription-query", count: 8 },
      { tag: "refund-request", count: 6 },
      { tag: "damaged-item", count: 5 },
      { tag: "product-question", count: 4 },
    ],
    fromCache: false,
  });
}
