import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../lib/auth";

export const runtime = "nodejs";

// Updated May 13, 2026 per Aina's feedback:
//  - `reasonMains` + `reasonSubs` arrays (multi-select, replaces single `reason`)
//  - `itemsAffected` array (replaces the old `itemsToShip` duplicate)
//  - `ticketId` is now mandatory
//  - Legacy `reason` + `type` + `status` columns kept for backwards-compat,
//    auto-populated from first selected main + sensible defaults.

const VALID_MAIN_REASONS = [
  "damaged-item",
  "damaged-package",
  "lost-package",
  "missing-item",
  "wrong-product-ordered",
  "wrong-address",
  "shipment-delay",
  "rts",
  "special-perks",
  "accidental-customer-damage",
];

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
  const reason = searchParams.get("reason");
  const status = searchParams.get("status");
  const warehouse = searchParams.get("warehouse");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (reason) where.reason = reason;
  if (status) where.status = status;
  if (warehouse) where.warehouse = warehouse;
  if (!roleAtLeast(role, "Lead Agent")) where.agent = userId;

  try {
    const rows = await db.replacement.findMany({
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

  const orderId = String(body.orderId ?? "").trim();
  if (!orderId) return Response.json({ error: "Order ID required" }, { status: 400 });

  // Mandatory now per Aina's feedback — needed for cross-email traceability
  const ticketId = body.ticketId ? String(body.ticketId).trim() : "";
  if (!ticketId) return Response.json({ error: "Gorgias ticket ID required" }, { status: 400 });

  // New: multi-select main reasons. At least one required.
  const reasonMains = Array.isArray(body.reasonMains)
    ? body.reasonMains.map(String).map((s) => s.trim()).filter(Boolean)
    : [];
  if (reasonMains.length === 0) {
    return Response.json({ error: "At least one Main Reason is required" }, { status: 400 });
  }
  for (const m of reasonMains) {
    if (!VALID_MAIN_REASONS.includes(m)) {
      return Response.json(
        { error: `Invalid main reason "${m}". Must be one of: ${VALID_MAIN_REASONS.join(", ")}` },
        { status: 400 }
      );
    }
  }

  // Sub reasons are free-form strings (the taxonomy is open-ended for some mains)
  const reasonSubs = Array.isArray(body.reasonSubs)
    ? body.reasonSubs.map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  // Items affected — array of SKU strings
  const itemsAffected = Array.isArray(body.itemsAffected)
    ? body.itemsAffected.map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  try {
    const row = await db.replacement.create({
      data: {
        orderId,
        ticketId,
        customerName: body.customerName ? String(body.customerName).trim() : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        country: body.country ? String(body.country).trim() : null,
        warehouse: body.warehouse ? String(body.warehouse).trim() : null,
        // Legacy fields — auto-populated for backwards compatibility
        type: "replacement",
        reason: reasonMains[0],
        // New fields
        reasonMains,
        reasonSubs,
        itemsAffected,
        originalOrder: body.originalOrder ? String(body.originalOrder).trim() : null,
        // itemsToShip kept nullable in schema; we don't populate it anymore
        itemsToShip: [],
        details: body.details ? String(body.details).trim() : null,
        courier: body.courier ? String(body.courier).trim() : null,
        status: "pending",
        // Solution = free-text now (renamed from Status in UI)
        solution: body.solution ? String(body.solution).trim() : null,
        agent: body.agent ? String(body.agent).trim() : userId,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
