import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-cnr-001", createdAt: new Date("2026-05-22T11:00:00Z").toISOString(), orderId: "#DTC-10448", customerName: "[Customer name]", country: "US", reason: "outside-policy-window", explanation: "Customer requested refund 45 days after purchase. Policy is 30 days. Offered store credit instead — declined.", escalated: false, agent: "demo" },
  { id: "demo-cnr-002", createdAt: new Date("2026-05-21T15:30:00Z").toISOString(), orderId: "#DTC-10427", customerName: "[Customer name]", country: "CA", reason: "opened-product", explanation: "Customer used 2 weeks of product then requested refund. Policy does not cover opened consumables past 30-day window.", escalated: false, agent: "demo" },
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
  const row = { id: `demo-cnr-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
