import { auth } from "@clerk/nextjs/server";
export const runtime = "nodejs";
export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { body = {}; }
  return Response.json({ row: { id: params.id, ...body, updatedAt: new Date().toISOString() } });
}
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ deleted: true, id: params.id });
}
