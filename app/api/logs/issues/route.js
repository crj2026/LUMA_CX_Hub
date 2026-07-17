import { auth } from "@clerk/nextjs/server";
import { issuesSeed } from "../../../../lib/demo-logs";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ rows: issuesSeed(), scope: "all" });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const row = { id: `demo-iss-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
