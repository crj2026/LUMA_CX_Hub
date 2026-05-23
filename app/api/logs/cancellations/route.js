import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "change-of-mind",
  "too-expensive",
  "didnt-like-taste",
  "adverse-reaction",
  "no-results",
  "duplicate-order",
  "shipping-cost",
  "shipping-delay",
  "address-change",
  "wrong-product",
  "test-order",
  "other",
];
const ALLOWED_SCOPES = ["order", "subscription", "both"];

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
  const type = searchParams.get("type");
  const scope = searchParams.get("scope");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (type) where.cancellationType = type;
  if (scope) where.scope = scope;
  if (!roleAtLeast(role, "Lead Agent")) where.agent = userId;

  try {
    const rows = await db.cancellation.findMany({
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
  if (!orderId) return Response.json({ error: "orderId required" }, { status: 400 });

  const cancellationType = String(body.cancellationType ?? "").trim();
  if (!ALLOWED_TYPES.includes(cancellationType)) {
    return Response.json(
      { error: `cancellationType must be one of: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const scope = String(body.scope ?? "subscription").trim();
  if (!ALLOWED_SCOPES.includes(scope)) {
    return Response.json(
      { error: `scope must be one of: ${ALLOWED_SCOPES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const row = await db.cancellation.create({
      data: {
        orderId,
        ticketId: body.ticketId ? String(body.ticketId).trim() : null,
        customerName: body.customerName ? String(body.customerName).trim() : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        country: body.country ? String(body.country).trim() : null,
        cancellationType,
        scope,
        notes: body.notes ? String(body.notes).trim() : null,
        agent: body.agent ? String(body.agent).trim() : userId,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
