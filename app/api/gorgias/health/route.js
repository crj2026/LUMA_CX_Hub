import { auth } from "@clerk/nextjs/server";
import { gorgiasHealth } from "../../../../lib/gorgias";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await gorgiasHealth();
    return Response.json(result);
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 502 });
  }
}
