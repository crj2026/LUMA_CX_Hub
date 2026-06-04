import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-or-001", createdAt: new Date("2026-05-23T07:50:00Z").toISOString(), type: "address-change", orderId: "#DTC-10475", customerName: "[Customer name]", country: "AU", details: "Customer moved — needs address updated before dispatch tomorrow.", status: "completed", agent: "demo" },
  { id: "demo-or-002", createdAt: new Date("2026-05-22T14:15:00Z").toISOString(), type: "delay-request", orderId: "#DTC-10460", customerName: "[Customer name]", country: "US", details: "Customer travelling until June 3 — requested dispatch to be held.", status: "pending", agent: "demo" },
  { id: "demo-or-003", createdAt: new Date("2026-05-21T10:00:00Z").toISOString(), type: "cancel-before-dispatch", orderId: "#DTC-10434", customerName: "[Customer name]", country: "GB", details: "Customer emailed within 30 minutes of ordering. Order cancelled before fulfilment.", status: "completed", agent: "demo" },
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
  const row = { id: `demo-or-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
