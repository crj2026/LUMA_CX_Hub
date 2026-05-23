// Report notes — free-text notes attached to a specific report window.
//
// GET  ?from=YYYY-MM-DD&to=YYYY-MM-DD → returns { note: {...} | null }
// PUT  body { from, to, body }        → upserts the note for that window
//
// Access: Lead Agent and above (same gate as the Reports tab).

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../lib/db";
import { getRole, getDisplayName, roleAtLeast } from "../../../lib/auth";

export const runtime = "nodejs";

function isYmd(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
}

async function requireLead() {
  const { userId } = await auth();
  if (!userId) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Lead Agent")) {
    return { error: Response.json({ error: "Forbidden — Lead Agent role required" }, { status: 403 }) };
  }
  return { user, userId, role };
}

export async function GET(req) {
  const guard = await requireLead();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!isYmd(from) || !isYmd(to)) {
    return Response.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const note = await db.reportNote.findUnique({
      where: { weekFrom_weekTo: { weekFrom: from, weekTo: to } },
    });
    return Response.json({ note });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const guard = await requireLead();
  if (guard.error) return guard.error;

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const from = String(body.from || "").trim();
  const to = String(body.to || "").trim();
  const text = String(body.body ?? "");
  if (!isYmd(from) || !isYmd(to)) {
    return Response.json({ error: "from and to must be YYYY-MM-DD" }, { status: 400 });
  }

  const editorName = getDisplayName(guard.user);

  try {
    const note = await db.reportNote.upsert({
      where: { weekFrom_weekTo: { weekFrom: from, weekTo: to } },
      create: {
        weekFrom: from,
        weekTo: to,
        body: text,
        editedById: guard.userId,
        editedByName: editorName,
      },
      update: {
        body: text,
        editedById: guard.userId,
        editedByName: editorName,
      },
    });
    return Response.json({ note });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
