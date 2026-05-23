import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-iss-001", createdAt: new Date("2026-05-23T09:14:00Z").toISOString(), orderId: "#DTC-10482", customerName: "Alex Rivera", country: "US", category: "damaged-item", severity: "normal", description: "Customer received two hardened sachets in their 30-day pack. Photo provided.", resolution: "replacement", resolutionNotes: "Replacement dispatched same day.", itemsAffected: ["[Client Product A] x2"], agent: "demo" },
  { id: "demo-iss-002", createdAt: new Date("2026-05-23T08:30:00Z").toISOString(), orderId: "#DTC-10479", customerName: "Sam Park", country: "AU", category: "missing-item", severity: "normal", description: "Customer received 29 sachets instead of 30. Pack seal intact on arrival.", resolution: "replacement", resolutionNotes: "Single sachet replacement sent.", itemsAffected: ["[Client Product A] x1"], agent: "demo" },
  { id: "demo-iss-003", createdAt: new Date("2026-05-22T16:45:00Z").toISOString(), orderId: "#DTC-10461", customerName: "Jordan Lee", country: "GB", category: "wrong-item", severity: "normal", description: "Customer ordered Lemon flavour, received Mango. Confirmed from photo.", resolution: "replacement", resolutionNotes: "Correct flavour sent. Customer keeping original.", itemsAffected: ["[Client Product B] x1"], agent: "demo" },
  { id: "demo-iss-004", createdAt: new Date("2026-05-22T11:20:00Z").toISOString(), orderId: "#DTC-10447", customerName: "Morgan Chen", country: "CA", category: "leaked-sachet", severity: "high", description: "Three sachets leaked inside sealed box. Product unusable. Photos provided.", resolution: "refund", resolutionNotes: "Full refund processed due to extent of damage.", itemsAffected: ["[Client Product A] x3"], agent: "demo" },
  { id: "demo-iss-005", createdAt: new Date("2026-05-21T14:00:00Z").toISOString(), orderId: "#DTC-10433", customerName: "Taylor Nguyen", country: "US", category: "other", severity: "normal", description: "Customer received box with different lot number than previous order, concerned about freshness.", resolution: "no-action", resolutionNotes: "Explained lot number rotation. Customer satisfied.", itemsAffected: [], agent: "demo" },
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
  const row = { id: `demo-iss-${Date.now()}`, createdAt: new Date().toISOString(), agent: userId, ...body };
  return Response.json({ row }, { status: 201 });
}
