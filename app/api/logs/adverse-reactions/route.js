import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-ar-001", createdAt: new Date("2026-05-22T10:20:00Z").toISOString(), orderId: "#LME-10453", customerName: "Tara Hennessy", country: "AU", symptoms: "Scalp redness and mild burning sensation after first use of Scalp Serum. Not the normal tingling — customer described it as painful.", severity: "moderate", productBatch: "LS-2605-A", escalated: true, escalatedTo: "Maya Chen", notes: "Advised to stop use immediately. Patch test on inner wrist confirmed sensitivity to peppermint oil. Full refund issued. Customer consulted GP — no further issues. Batch LS-2605-A flagged for quality review.", agent: "demo" },
  { id: "demo-ar-002", createdAt: new Date("2026-05-20T13:45:00Z").toISOString(), orderId: "#LME-10399", customerName: "Ben Cartwright", country: "US", symptoms: "Mild itching on scalp during first week of Scalp Serum use. Resolved after reducing application to 2x per week.", severity: "mild", productBatch: "LS-2604-B", escalated: false, escalatedTo: null, notes: "Customer was applying daily instead of 3x per week as directed. Adjusted frequency — itching resolved within 3 days. Continuing subscription.", agent: "demo" },
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
