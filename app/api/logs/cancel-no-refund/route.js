// Cancel — No Refund log.
// GET  → list rows (own when Agent, all when Lead Agent+)
// POST → create a new entry. All four content fields required.
//
// Mirrors the structure of /api/logs/cancellations.

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Agent")) {
    return Response.json({ error: "Forbidden — Agent role required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  // Agents see their own; Lead Agent+ sees everyone's
  if (!roleAtLeast(role, "Lead Agent")) where.agent = userId;

  try {
    const rows = await db.cancelNoRefund.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Response.json({ rows, scope: roleAtLeast(role, "Lead Agent") ? "all" : "own" });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Agent")) {
    return Response.json({ error: "Forbidden — Agent role required" }, { status: 403 });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  // All four content fields mandatory per Aina's spec
  const cancelledOrderId   = String(body.cancelledOrderId ?? "").trim();
  const ticketId           = String(body.ticketId ?? "").trim();
  const replacementOrderId = String(body.replacementOrderId ?? "").trim();
  const reasonNotRefunded  = String(body.reasonNotRefunded ?? "").trim();

  if (!cancelledOrderId)   return Response.json({ error: "cancelledOrderId required" },   { status: 400 });
  if (!ticketId)           return Response.json({ error: "ticketId required" },           { status: 400 });
  if (!replacementOrderId) return Response.json({ error: "replacementOrderId required" }, { status: 400 });
  if (!reasonNotRefunded)  return Response.json({ error: "reasonNotRefunded required" },  { status: 400 });

  try {
    const row = await db.cancelNoRefund.create({
      data: {
        cancelledOrderId,
        ticketId,
        replacementOrderId,
        reasonNotRefunded,
        notes: body.notes ? String(body.notes).trim() : null,
        agent: body.agent ? String(body.agent).trim() : userId,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
