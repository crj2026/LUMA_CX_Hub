import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// [BRAND_NAME] demo — CX trend themes from customer messages this week.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    themes: [
      { theme: "[Trend theme 1]", volume: 89, sentiment: "neutral",  summary: "[What's driving this theme + recommended action.]" },
      { theme: "[Trend theme 2]", volume: 67, sentiment: "negative", summary: "[What's driving this theme + recommended action.]" },
      { theme: "[Trend theme 3]", volume: 44, sentiment: "neutral",  summary: "[What's driving this theme + recommended action.]" },
      { theme: "[Trend theme 4]", volume: 34, sentiment: "negative", summary: "[What's driving this theme + recommended action.]" },
      { theme: "[Trend theme 5]", volume: 28, sentiment: "positive", summary: "[What's driving this theme + recommended action.]" },
    ],
    generatedAt: new Date().toISOString(),
    fromCache: false,
  });
}
