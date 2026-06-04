import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// PLACEHOLDER demo issue rows — shown when the table is empty. Replace freely.
const SEED_ROWS = [
  { id: "demo-iss-001", createdAt: new Date("2026-05-23T09:14:00Z").toISOString(), orderId: "#ORD-10482", customerName: "[Customer name]", country: "AU", category: "damaged-item", severity: "normal", description: "[Describe the issue — e.g. item arrived damaged, photo provided.]", resolution: "replacement", resolutionNotes: "[How it was resolved.]", itemsAffected: ["[Product] x1"], agent: "demo" },
  { id: "demo-iss-002", createdAt: new Date("2026-05-23T08:30:00Z").toISOString(), orderId: "#ORD-10479", customerName: "[Customer name]", country: "US", category: "wrong-item", severity: "normal", description: "[Describe the issue — e.g. wrong item received.]", resolution: "replacement", resolutionNotes: "[How it was resolved.]", itemsAffected: ["[Product] x1"], agent: "demo" },
  { id: "demo-iss-003", createdAt: new Date("2026-05-22T16:45:00Z").toISOString(), orderId: "#ORD-10461", customerName: "[Customer name]", country: "GB", category: "wrong-item", severity: "normal", description: "[Describe the issue.]", resolution: "replacement", resolutionNotes: "[How it was resolved.]", itemsAffected: ["[Product] x1", "[Product] x1"], agent: "demo" },
  { id: "demo-iss-004", createdAt: new Date("2026-05-22T11:20:00Z").toISOString(), orderId: "#ORD-10447", customerName: "[Customer name]", country: "AU", category: "leaked-sachet", severity: "high", description: "[Describe the issue.]", resolution: "refund", resolutionNotes: "[How it was resolved.]", itemsAffected: ["[Product] x1"], agent: "demo" },
  { id: "demo-iss-005", createdAt: new Date("2026-05-21T14:00:00Z").toISOString(), orderId: "#ORD-10433", customerName: "[Customer name]", country: "AU", category: "damaged-item", severity: "normal", description: "[Describe the issue.]", resolution: "replacement", resolutionNotes: "[How it was resolved.]", itemsAffected: ["[Product] x1", "[Product] x1"], agent: "demo" },
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
