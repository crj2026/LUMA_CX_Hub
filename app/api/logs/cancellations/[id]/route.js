import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

const STRING_FIELDS = [
  "ticketId", "customerName", "customerEmail", "country", "notes",
];
const ENUMS = {
  cancellationType: [
    "change-of-mind", "too-expensive", "didnt-like-taste", "adverse-reaction",
    "no-results", "duplicate-order", "shipping-cost", "shipping-delay",
    "address-change", "wrong-product", "test-order", "other",
  ],
  scope: ["order", "subscription", "both"],
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
  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (body[field] !== undefined) {
      const v = String(body[field]).trim();
      if (!allowed.includes(v)) return Response.json({ error: `${field} must be one of: ${allowed.join(", ")}` }, { status: 400 });
      data[field] = v;
    }
  }
  if (Object.keys(data).length === 0) return Response.json({ error: "No fields to update" }, { status: 400 });

  try {
    const row = await db.cancellation.update({ where: { id }, data });
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
    await db.cancellation.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
