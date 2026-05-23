import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-ar-001", createdAt: new Date("2026-05-22T10:20:00Z").toISOString(), orderId: "#DTC-10453", customerName: "Kendall Brooks", country: "US", symptoms: "Mild nausea after first two days of use", severity: "mild", productBatch: "BT-2604-A", escalated: true, escalatedTo: "Head of CX", notes: "Customer advised to take with food. Monitoring. No further symptoms after day 3.", agent: "demo" },
  { id: "demo-ar-002", createdAt: new Date("2026-05-20T13:45:00Z").toISOString(), orderId: "#DTC-10399", customerName: "Reese Yamamoto", country: "AU", symptoms: "Mild stomach discomfort during first week", severity: "mild", productBatch: "BT-2604-B", escalated: false, escalatedTo: null, notes: "Resolved after adjusting intake timing. Customer continuing subscription.", agent: "demo" },
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
  const row = { id: `demo-ar-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
