import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// PLACEHOLDER demo feedback rows — replace with real data (or wire to the DB).
const SEED_ROWS = [
  { id: "demo-fb-001", createdAt: new Date("2026-05-23T11:30:00Z").toISOString(), orderId: "#ORD-10480", customerName: "[Customer name]", country: "AU", type: "positive", channel: "email", summary: "[Positive feedback summary — e.g. great results with a product.]", trustpilotPrompted: true, agent: "demo" },
  { id: "demo-fb-002", createdAt: new Date("2026-05-22T09:10:00Z").toISOString(), orderId: "#ORD-10449", customerName: "[Customer name]", country: "GB", type: "negative", channel: "chat", summary: "[Negative feedback summary — e.g. a product expectation that wasn't set.]", trustpilotPrompted: false, agent: "demo" },
  { id: "demo-fb-003", createdAt: new Date("2026-05-21T14:50:00Z").toISOString(), orderId: "#ORD-10421", customerName: "[Customer name]", country: "US", type: "feature-request", channel: "email", summary: "[Feature request summary.]", trustpilotPrompted: false, agent: "demo" },
  { id: "demo-fb-004", createdAt: new Date("2026-05-20T16:00:00Z").toISOString(), orderId: "#ORD-10408", customerName: "[Customer name]", country: "AU", type: "positive", channel: "instagram", summary: "[Positive feedback summary — e.g. customer referral.]", trustpilotPrompted: true, agent: "demo" },
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
