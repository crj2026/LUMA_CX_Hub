import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-fb-001", createdAt: new Date("2026-05-23T11:30:00Z").toISOString(), orderId: "#DTC-10480", customerName: "Frankie O'Brien", country: "US", type: "positive", channel: "email", summary: "Customer sent an unsolicited email saying results have been transformative after 3 months. Happy to leave a review.", trustpilotPrompted: true, agent: "demo" },
  { id: "demo-fb-002", createdAt: new Date("2026-05-22T09:10:00Z").toISOString(), orderId: "#DTC-10449", customerName: "Blake Torres", country: "AU", type: "negative", channel: "chat", summary: "Customer unhappy with taste of new batch. Offered flavour swap, accepted.", trustpilotPrompted: false, agent: "demo" },
  { id: "demo-fb-003", createdAt: new Date("2026-05-21T14:50:00Z").toISOString(), orderId: "#DTC-10421", customerName: "Rowan Ellis", country: "GB", type: "feature-request", channel: "email", summary: "Customer requesting a capsule format instead of sachets for travel convenience.", trustpilotPrompted: false, agent: "demo" },
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
  const row = { id: `demo-fb-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
