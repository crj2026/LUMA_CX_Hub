import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_METHODS = ["email", "phone", "live-chat", "instagram", "facebook", "tiktok", "other"];
const ALLOWED_SEVERITY = ["low", "moderate", "high", "serious"];
const ALLOWED_STATUS = ["open", "under-review", "closed"];

// Adverse-reaction records are sensitive — Agents can CREATE them so the
// initial intake captures the report immediately, but only Lead Agent+ can
// read the list (these are PHI-adjacent / regulatory records). Edits are
// gated to Manager+ when we add the PATCH endpoint.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Lead Agent")) {
    return Response.json({ error: "Forbidden — Lead Agent role required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const onlySerious = searchParams.get("serious") === "1";
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (severity) where.severity = severity;
  if (status) where.status = status;
  if (onlySerious) where.isSerious = true;

  try {
    const rows = await db.adverseReaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Response.json({ rows });
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
  if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });

  const description = String(body.complaintDescription ?? "").trim();
  if (!description) return Response.json({ error: "complaintDescription required" }, { status: 400 });

  const severity = String(body.severity ?? "low").trim();
  if (!ALLOWED_SEVERITY.includes(severity)) {
    return Response.json({ error: `severity must be one of: ${ALLOWED_SEVERITY.join(", ")}` }, { status: 400 });
  }

  const complaintMethod = String(body.complaintMethod ?? "email").trim();
  if (!ALLOWED_METHODS.includes(complaintMethod)) {
    return Response.json({ error: `complaintMethod must be one of: ${ALLOWED_METHODS.join(", ")}` }, { status: 400 });
  }

  const status = String(body.status ?? "open").trim();
  if (!ALLOWED_STATUS.includes(status)) {
    return Response.json({ error: `status must be one of: ${ALLOWED_STATUS.join(", ")}` }, { status: 400 });
  }

  try {
    const row = await db.adverseReaction.create({
      data: {
        orderId,
        ticketId: body.ticketId ? String(body.ticketId).trim() : null,
        customerName: body.customerName ? String(body.customerName).trim() : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        customerPhone: body.customerPhone ? String(body.customerPhone).trim() : null,
        country: body.country ? String(body.country).trim() : null,
        patientSameAsCustomer: body.patientSameAsCustomer !== false,
        patientName: body.patientName ? String(body.patientName).trim() : null,
        patientAge: body.patientAge ? String(body.patientAge).trim() : null,
        complaintMethod,
        complaintDescription: description,
        productsAffected: Array.isArray(body.productsAffected) ? body.productsAffected.map(String) : [],
        lotNumbers: Array.isArray(body.lotNumbers) ? body.lotNumbers.map(String) : [],
        symptoms: Array.isArray(body.symptoms) ? body.symptoms.map(String) : [],
        severity,
        isSerious: !!body.isSerious || severity === "serious",
        escalatedTo: body.escalatedTo ? String(body.escalatedTo).trim() : null,
        fdaMedwatchFiled: !!body.fdaMedwatchFiled,
        mrddNumber: body.mrddNumber ? String(body.mrddNumber).trim() : null,
        returnRequested: !!body.returnRequested,
        rmaNumber: body.rmaNumber ? String(body.rmaNumber).trim() : null,
        followUpAt: body.followUpAt ? new Date(body.followUpAt) : null,
        followUpMethod: body.followUpMethod ? String(body.followUpMethod).trim() : null,
        followUpNotes: body.followUpNotes ? String(body.followUpNotes).trim() : null,
        status,
        agent: body.agent ? String(body.agent).trim() : userId,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
