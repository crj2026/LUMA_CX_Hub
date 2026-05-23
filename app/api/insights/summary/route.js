import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — Gorgias ticket summary data.
// byChannel and topTags must be plain { label: number } objects so that
// sortEntries (Object.entries → sort by value) works correctly in the UI.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    volume: 847,
    totalAcrossBrands: 847,
    csat: { average: 4.6, count: 312 },
    resolution: { avgSeconds: 2040, count: 724 },
    mpt: { average: 3.2, count: 724 },
    byChannel: {
      "Email":     482,
      "Chat":      241,
      "Instagram": 78,
      "Facebook":  46,
    },
    byStatus: { open: 41, pending: 82, closed: 724 },
    topTags: {
      "Order status / tracking":  237,
      "Subscription changes":     186,
      "Product questions":        152,
      "Refund requests":          119,
      "Reaction / concern":        76,
    },
    fromCache: false,
  });
}
