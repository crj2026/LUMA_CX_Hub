// Cancel — No Refund row endpoint.
// PATCH  → update fields (Manager+ only)
// DELETE → remove row (Manager+ only)
//
// All four content fields are required at creation but can be edited
// here. Empty-string updates are rejected (would violate the spec's
// mandatory rule). Use a different value, don't blank.

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

const REQUIRED_FIELDS = [
  "cancelledOrderId",
  "ticketId",
  "replacementOrderId",
  "reasonNotRefunded",
];
const OPTIONAL_STRING_FIELDS = ["notes"];

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
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data = {};

  for (const f of REQUIRED_FIELDS) {
    if (body[f] !== undefined) {
      const v = String(body[f] ?? "").trim();
      if (!v) return Response.json({ error: `${f} cannot be blank` }, { status: 400 });
      data[f] = v;
    }
  }
  for (const f of OPTIONAL_STRING_FIELDS) {
    if (body[f] !== undefined) {
      data[f] = body[f] === null || body[f] === "" ? null : String(body[f]).trim();
    }
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const row = await db.cancelNoRefund.update({ where: { id }, data });
    return Response.json({ row });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

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
    await db.cancelNoRefund.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
