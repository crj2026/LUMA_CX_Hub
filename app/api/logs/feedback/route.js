import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../lib/auth";

export const runtime = "nodejs";

const ALLOWED_THEMES = [
  "product",
  "packaging",
  "subscription",
  "shipping",
  "pricing",
  "marketing",
  "loyalty",
  "tech",
  "service",
  "other",
];
const ALLOWED_TEAMS = [
  "Product",
  "Marketing",
  "Ops/Logistics",
  "Tech",
  "CX",
  "Other",
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
  const theme = searchParams.get("theme");
  const team = searchParams.get("team");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (theme) where.theme = theme;
  if (team) where.relatedTeam = team;
  if (!roleAtLeast(role, "Lead Agent")) where.agent = userId;

  try {
    const rows = await db.feedback.findMany({
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

  const theme = String(body.theme ?? "").trim();
  if (!ALLOWED_THEMES.includes(theme)) {
    return Response.json(
      { error: `theme must be one of: ${ALLOWED_THEMES.join(", ")}` },
      { status: 400 }
    );
  }

  const details = String(body.details ?? "").trim();
  if (!details) return Response.json({ error: "details required" }, { status: 400 });

  const relatedTeam = body.relatedTeam ? String(body.relatedTeam).trim() : null;
  if (relatedTeam && !ALLOWED_TEAMS.includes(relatedTeam)) {
    return Response.json(
      { error: `relatedTeam must be one of: ${ALLOWED_TEAMS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const row = await db.feedback.create({
      data: {
        orderId: body.orderId ? String(body.orderId).trim() : null,
        ticketId: body.ticketId ? String(body.ticketId).trim() : null,
        customerName: body.customerName ? String(body.customerName).trim() : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
        country: body.country ? String(body.country).trim() : null,
        theme,
        relatedTeam,
        details,
        suggestion: body.suggestion ? String(body.suggestion).trim() : null,
        agent: body.agent ? String(body.agent).trim() : userId,
      },
    });
    return Response.json({ row }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
