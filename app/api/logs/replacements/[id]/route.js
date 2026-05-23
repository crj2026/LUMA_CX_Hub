import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

const STRING_FIELDS = [
  "ticketId", "customerName", "customerEmail", "country", "warehouse",
  "originalOrder", "details", "courier", "solution",
];
// Added May 13 — Records grid edits to the new array fields go here.
// `itemsToShip` kept for legacy row edits.
const ARRAY_FIELDS = ["itemsToShip", "reasonMains", "reasonSubs", "itemsAffected"];
// Enum validation kept for legacy edits to old rows. New rows write to
// the array fields and don't trigger these.
const ENUMS = {
  type: ["replacement", "gift"],
  reason: [
    // Legacy single-value set
    "damaged-item", "lost-package", "missing-item", "wrong-item",
    "order-change", "customer-damage", "shaker-issue", "faulty-mixer", "rts", "other",
    // New taxonomy values (auto-populated on new rows from first main)
    "damaged-package", "wrong-product-ordered", "wrong-address",
    "shipment-delay", "special-perks", "accidental-customer-damage",
  ],
  status: ["pending", "in-progress", "shipped", "delivered", "cancelled"],
};

export async function PATCH(req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Manager")) {
    return Response.json({ error: "Forbidden — Manager role required" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data = {};
  for (const f of STRING_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] === null || body[f] === "" ? null : String(body[f]).trim();
  }
  for (const f of ARRAY_FIELDS) {
    if (body[f] !== undefined) data[f] = Array.isArray(body[f]) ? body[f].map(String) : [];
  }
  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (body[field] !== undefined) {
      const v = String(body[field]).trim();
      if (!allowed.includes(v)) return Response.json({ error: `${field} must be one of: ${allowed.join(", ")}` }, { status: 400 });
      data[field] = v;
    }
  }
  if (Object.keys(data).length === 0) return Response.json({ error: "No fields to update" }, { status: 400 });

  try {
    const row = await db.replacement.update({ where: { id }, data });
    return Response.json({ row });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE → remove the row entirely. Manager+ only.
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
    await db.replacement.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
