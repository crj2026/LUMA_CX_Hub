import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

const STRING_FIELDS = [
  "ticketId", "customerName", "customerEmail", "customerPhone", "country",
  "patientName", "patientAge", "complaintDescription", "escalatedTo",
  "mrddNumber", "rmaNumber", "followUpMethod", "followUpNotes",
  "qcReviewer", "qcNotes",
];
const ARRAY_FIELDS = ["productsAffected", "lotNumbers", "symptoms"];
const BOOL_FIELDS = ["patientSameAsCustomer", "isSerious", "fdaMedwatchFiled", "returnRequested"];
const DATE_FIELDS = ["followUpAt", "qcReviewedAt"];
const ENUMS = {
  complaintMethod: ["email", "phone", "live-chat", "instagram", "facebook", "tiktok", "other"],
  severity: ["low", "moderate", "high", "serious"],
  status: ["open", "under-review", "closed"],
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
  for (const f of BOOL_FIELDS) {
    if (body[f] !== undefined) data[f] = !!body[f];
  }
  for (const f of DATE_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f]) : null;
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
    const row = await db.adverseReaction.update({ where: { id }, data });
    return Response.json({ row });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE → remove the row entirely. Manager+ only.
// Adverse reactions carry regulatory weight — deletion should be rare
// and only by senior roles (test rows, true duplicates).
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
    await db.adverseReaction.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
