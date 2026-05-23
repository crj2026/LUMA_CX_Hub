import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    themes: [
      {
        theme: "Shipping delays — domestic",
        volume: 9,
        sentiment: "negative",
        summary: "Customers in metro areas reporting 1–2 day delays beyond expected delivery window. Spike started Mon.",
      },
      {
        theme: "Subscription queries — billing cycle",
        volume: 8,
        sentiment: "neutral",
        summary: "Customers confused about when next renewal processes after a skip. FAQ update may reduce volume.",
      },
      {
        theme: "Product satisfaction — repeat purchasers",
        volume: 7,
        sentiment: "positive",
        summary: "Returning customers leaving positive unprompted feedback about results. Good Trustpilot prompt opportunity.",
      },
      {
        theme: "Refund requests — first-time buyers",
        volume: 6,
        sentiment: "negative",
        summary: "New customers requesting refunds citing taste/texture mismatch. Consider improving onboarding comms.",
      },
      {
        theme: "Damaged packaging — specific SKU",
        volume: 5,
        sentiment: "negative",
        summary: "Cluster of damaged outer-box reports on one SKU. Flag to warehouse/fulfilment for investigation.",
      },
    ],
    generatedAt: new Date().toISOString(),
    fromCache: false,
  });
}
