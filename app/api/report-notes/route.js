import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Demo mock — report notes stored in memory (lost on server restart, fine for demo).
const notes = new Map();

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const key = `${searchParams.get("from")}_${searchParams.get("to")}`;
  return Response.json({ note: notes.get(key) ?? null });
}

export async function PUT(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const key = `${body.from}_${body.to}`;
  const note = { id: key, from: body.from, to: body.to, body: body.body, updatedAt: new Date().toISOString(), agent: userId };
  notes.set(key, note);
  return Response.json({ note });
}
