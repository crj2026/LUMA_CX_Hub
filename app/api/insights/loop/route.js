import { auth } from "@clerk/nextjs/server";
import { DEMO_LOOP } from "../../../../lib/demo-insights";

export const runtime = "nodejs";

// LUMÉ demo data — single source of truth in lib/demo-insights.js, which
// the client also imports directly for instant first paint.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(DEMO_LOOP);
}
