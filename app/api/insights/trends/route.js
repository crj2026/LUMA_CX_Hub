import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// LUMÉ demo — CX trend themes from customer messages this week.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    themes: [
      {
        theme: "Scalp Serum tingling sensation",
        volume: 89,
        sentiment: "neutral",
        summary: "High volume of customers asking about tingling from peppermint oil in Scalp Serum. Reassurance resolving tickets well — consider adding FAQ to product page to reduce inbound.",
      },
      {
        theme: "Repair Serum results timeline — week 3–4 cluster",
        volume: 67,
        sentiment: "negative",
        summary: "Customers at the 3–4 week mark expressing frustration with results. Expected spike. Timeline education (strength visible at 6 weeks) is resolving most. Consider proactive email at week 3.",
      },
      {
        theme: "Hair Edit swap requests — approaching 12th cutoff",
        volume: 44,
        sentiment: "neutral",
        summary: "Swap request volume spiking as the 12th approaches. Agents processing well. Consider a reminder email on the 10th to reduce inbound before the cutoff.",
      },
      {
        theme: "Failed payment follow-up",
        volume: 34,
        sentiment: "negative",
        summary: "Failed payments up 18% vs last week. Customers receiving automated dunning but some not re-engaging. Proactive outreach campaign recommended.",
      },
      {
        theme: "Subscription cancellation saves — positive",
        volume: 28,
        sentiment: "positive",
        summary: "Save rate sitting at 43% this week, up from 38% last week. Wrong serum saves particularly effective at 61%. Team is executing save plays well.",
      },
    ],
    generatedAt: new Date().toISOString(),
    fromCache: false,
  });
}
