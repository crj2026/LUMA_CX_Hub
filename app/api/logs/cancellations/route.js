import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-can-001", createdAt: new Date("2026-05-23T08:55:00Z").toISOString(), orderId: "#DTC-10476", customerName: "Quinn Adams", country: "US", reason: "too-expensive", retentionOffer: "10% discount offered", retentionOutcome: "declined", notes: "Customer on tight budget. Offered pause option — declined. Cancelled.", agent: "demo" },
  { id: "demo-can-002", createdAt: new Date("2026-05-22T13:40:00Z").toISOString(), orderId: "#DTC-10451", customerName: "Avery Russo", country: "CA", reason: "not-seeing-results", retentionOffer: "Offered product usage tips and 30-day extension", retentionOutcome: "saved", notes: "Customer was only taking half dose. Explained protocol. Agreed to continue.", agent: "demo" },
  { id: "demo-can-003", createdAt: new Date("2026-05-21T16:20:00Z").toISOString(), orderId: "#DTC-10438", customerName: "Sage Mitchell", country: "GB", reason: "switching-product", retentionOffer: "Offered flavour swap", retentionOutcome: "declined", notes: "Customer switching to competitor. No amount of retention would help.", agent: "demo" },
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
  const row = { id: `demo-can-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
