import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-rep-001", createdAt: new Date("2026-05-23T10:05:00Z").toISOString(), orderId: "#DTC-10481", customerName: "[Customer name]", country: "US", mainReasons: ["damaged-item"], subReasons: ["damaged-item::Hardened Sachet"], itemsAffected: ["[Client Product A] x2"], description: "Two sachets hardened and unusable. Photo confirmed.", resolution: "replacement", agent: "demo" },
  { id: "demo-rep-002", createdAt: new Date("2026-05-22T15:30:00Z").toISOString(), orderId: "#DTC-10458", customerName: "[Customer name]", country: "AU", mainReasons: ["lost-package"], subReasons: ["lost-package::Confirmed by courier"], itemsAffected: ["[Client Product A] x1"], description: "Courier confirmed lost. Customer provided tracking screenshot.", resolution: "replacement", agent: "demo" },
  { id: "demo-rep-003", createdAt: new Date("2026-05-21T09:15:00Z").toISOString(), orderId: "#DTC-10422", customerName: "[Customer name]", country: "GB", mainReasons: ["missing-item"], subReasons: [], itemsAffected: ["[Client Product B] x1"], description: "Only 2 of 3 ordered items arrived. Confirmed from unboxing video.", resolution: "replacement", agent: "demo" },
];

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ rows: SEED_ROWS, scope: "all" });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const row = { id: `demo-rep-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
