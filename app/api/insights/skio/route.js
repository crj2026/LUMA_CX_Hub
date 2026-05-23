import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({
    activeSubscriptions: 3284,
    newSubscriptions: 187,
    churnedSubscriptions: 62,
    churnRate: 0.0189,
    pausedSubscriptions: 143,
    mrr: 284730,
    fromCache: false,
  });
}
