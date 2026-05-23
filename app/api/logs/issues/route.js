import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = [
  "missing-item",
  "damaged-item",
  "wrong-item",
  "leaked-sachet",
  "broken-bottle",
  "faulty-mixer",
  "tampered-package",
  // Added May 13 per Aina — frequently-occurring categories
  "longevity-taste",
  "not-enough-sachet",
  "subscription-payment-failed",
  "other",
];
const ALLOWED_RESOLUTIONS = ["pending", "replacement", "refund", "gift", "no-action"];

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
  const category = searchParams.get("category");
  const resolution = searchParams.get("resolution");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (category) where.category = category;
  if (resolution) where.resolution = resolution;
  // Agents see only their own entries; Lead Agent+ sees all
  if (!roleAtLeast(role, "Lead Agent")) {
    where.agent = userId;
  }

  try {
    const rows = await db.issueLog.findMany({
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
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "").trim();
  if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });

  const category = String(body.category ?? "").trim();
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return Response.json(
      { error: `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const resolution = String(body.resolution ?? "pending").trim();
  if (!ALLOWED_RESOLUTIONS.includes(resolution)) {
    return Response.json(
      { error: `resolution must be one of: ${ALLOWED_RESOLUTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const description = String(body.description ?? "").trim();
  if (!description) return Response.json({ error: "description required" }, { status: 400 });

  try {
    const row = await db.issueLog.create({
      data: {
        orderId,
        ticketId: body.ticketId ? String(body.ticketId).trim() : null,
        customerName: body.customerName ? String(body.customerName).trim() : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        country: body.country ? String(body.country).trim() : null,
        warehouse: body.warehouse ? String(body.warehouse).trim() : null,
        category,
        severity: body.severity ? String(body.severity).trim() : "normal",
        itemsAffected: Array.isArray(body.itemsAffected) ? body.itemsAffected.map(String) : [],
        description,
        photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls.map(String) : [],
        videoUrl: body.videoUrl ? String(body.videoUrl).trim() : null,
        resolution,
        resolutionNotes: body.resolutionNotes ? String(body.resolutionNotes).trim() : null,
        agent: body.agent ? String(body.agent).trim() : userId,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
