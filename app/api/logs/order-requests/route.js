import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast, isOps } from "../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_REGIONS = ["US", "UK", "HK", "ME"];
const ALLOWED_STATUSES = ["pending", "in-progress", "shipped", "delivered", "cancelled"];

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
  const region = searchParams.get("region");
  const status = searchParams.get("status");
  const sent = searchParams.get("sent");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (region) where.region = region;
  if (status) where.status = status;
  if (sent === "1") where.sent = true;
  if (sent === "0") where.sent = false;
  // Ops and Lead Agent+ see everyone's order requests; plain Agents see own
  const seesAll = roleAtLeast(role, "Lead Agent") || isOps(role);
  if (!seesAll) where.agent = userId;

  try {
    const rows = await db.orderRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Response.json({ rows, scope: seesAll ? "all" : "own" });
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

  const region = String(body.region ?? "").trim().toUpperCase();
  if (!ALLOWED_REGIONS.includes(region)) {
    return Response.json({ error: `region must be one of: ${ALLOWED_REGIONS.join(", ")}` }, { status: 400 });
  }

  const im8OrderRef = String(body.im8OrderRef ?? "").trim();
  if (!im8OrderRef) return Response.json({ error: "im8OrderRef required" }, { status: 400 });

  const recipientName = String(body.recipientName ?? "").trim();
  if (!recipientName) return Response.json({ error: "recipientName required" }, { status: 400 });

  const itemsDescription = String(body.itemsDescription ?? "").trim();
  if (!itemsDescription) return Response.json({ error: "itemsDescription required" }, { status: 400 });

  const status = String(body.status ?? "pending").trim();
  if (!ALLOWED_STATUSES.includes(status)) {
    return Response.json({ error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 });
  }

  try {
    const row = await db.orderRequest.create({
      data: {
        region,
        requestedBy: body.requestedBy ? String(body.requestedBy).trim() : null,
        agent: body.agent ? String(body.agent).trim() : userId,
        ticketId: body.ticketId ? String(body.ticketId).trim() : null,
        im8OrderRef,
        referenceNumber: body.referenceNumber ? String(body.referenceNumber).trim() : null,
        d365SalesOrderNumber: body.d365SalesOrderNumber ? String(body.d365SalesOrderNumber).trim() : null,
        d365SKUs: Array.isArray(body.d365SKUs) ? body.d365SKUs.map(String) : [],
        dispatchWarehouse: body.dispatchWarehouse ? String(body.dispatchWarehouse).trim() : null,
        shipCarrier: body.shipCarrier ? String(body.shipCarrier).trim() : null,
        awb: body.awb ? String(body.awb).trim() : null,
        shipDate: body.shipDate ? new Date(body.shipDate) : null,
        sent: !!body.sent,
        recipientName,
        shipToAddress1: body.shipToAddress1 ? String(body.shipToAddress1).trim() : null,
        shipToAddress2: body.shipToAddress2 ? String(body.shipToAddress2).trim() : null,
        shipToCity: body.shipToCity ? String(body.shipToCity).trim() : null,
        shipToState: body.shipToState ? String(body.shipToState).trim() : null,
        shipToZip: body.shipToZip ? String(body.shipToZip).trim() : null,
        shipToCountry: body.shipToCountry ? String(body.shipToCountry).trim() : null,
        shipToPhone: body.shipToPhone ? String(body.shipToPhone).trim() : null,
        shipToEmail: body.shipToEmail ? String(body.shipToEmail).trim() : null,
        itemsDescription,
        status,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
