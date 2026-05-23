import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/db";
import { getRole, canEditOpsRequest, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_REGIONS = ["US", "UK", "HK", "ME"];
const ALLOWED_STATUSES = ["pending", "in-progress", "shipped", "delivered", "cancelled"];

const STRING_FIELDS = [
  "requestedBy", "ticketId", "im8OrderRef", "referenceNumber",
  "d365SalesOrderNumber", "dispatchWarehouse", "shipCarrier", "awb",
  "recipientName", "shipToAddress1", "shipToAddress2", "shipToCity",
  "shipToState", "shipToZip", "shipToCountry", "shipToPhone",
  "shipToEmail", "itemsDescription", "notes",
];

// Order requests are shared ops workflow records — anyone Lead Agent+ can
// edit any entry (CS captures, Ops fills in dispatch detail later).
export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!canEditOpsRequest(role)) {
    return Response.json({ error: "Forbidden — Ops or Lead Agent+ required" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data = {};
  if (body.region !== undefined) {
    const r = String(body.region).trim().toUpperCase();
    if (!ALLOWED_REGIONS.includes(r)) {
      return Response.json({ error: `region must be one of: ${ALLOWED_REGIONS.join(", ")}` }, { status: 400 });
    }
    data.region = r;
  }
  if (body.status !== undefined) {
    const s = String(body.status).trim();
    if (!ALLOWED_STATUSES.includes(s)) {
      return Response.json({ error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 });
    }
    data.status = s;
  }
  if (body.sent !== undefined) data.sent = !!body.sent;
  if (body.shipDate !== undefined) data.shipDate = body.shipDate ? new Date(body.shipDate) : null;
  if (body.d365SKUs !== undefined) {
    data.d365SKUs = Array.isArray(body.d365SKUs) ? body.d365SKUs.map(String) : [];
  }
  for (const f of STRING_FIELDS) {
    if (body[f] !== undefined) {
      const v = body[f];
      data[f] = v === null || v === "" ? null : String(v).trim();
    }
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const row = await db.orderRequest.update({ where: { id }, data });
    return Response.json({ row });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE → remove the row entirely. Manager+ only (stricter than PATCH —
// deletion is destructive, so we don't let Ops or Lead Agent remove rows
// even though they can edit them).
export async function DELETE(_req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Manager")) {
    return Response.json({ error: "Forbidden — Manager role required" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    await db.orderRequest.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
