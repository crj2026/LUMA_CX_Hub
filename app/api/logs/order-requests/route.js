import { auth } from "@clerk/nextjs/server";
import { orderRequestsSeed } from "../../../../lib/demo-logs";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const unsentOnly = searchParams.get("sent") === "0";
  let rows = orderRequestsSeed();
  if (region) rows = rows.filter((r) => r.region === region);
  if (unsentOnly) rows = rows.filter((r) => !r.sent);
  return Response.json({ rows, scope: "all" });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const row = { id: `demo-or-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
