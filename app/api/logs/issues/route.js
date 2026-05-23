import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-iss-001", createdAt: new Date("2026-05-23T09:14:00Z").toISOString(), orderId: "#LME-10482", customerName: "Chloe Fitzpatrick", country: "AU", category: "damaged-item", severity: "normal", description: "Customer received Smooth Serum with pump mechanism broken on arrival. Photo provided — pump head snapped off.", resolution: "replacement", resolutionNotes: "Replacement dispatched same day. No return required.", itemsAffected: ["Smooth Serum x1"], agent: "demo" },
  { id: "demo-iss-002", createdAt: new Date("2026-05-23T08:30:00Z").toISOString(), orderId: "#LME-10479", customerName: "James Okafor", country: "US", category: "wrong-item", severity: "normal", description: "Customer ordered Repair Serum, received Glow Serum. Confirmed from photo of box label.", resolution: "replacement", resolutionNotes: "Correct Repair Serum sent. Customer keeping the Glow Serum as a gift.", itemsAffected: ["Repair Serum x1"], agent: "demo" },
  { id: "demo-iss-003", createdAt: new Date("2026-05-22T16:45:00Z").toISOString(), orderId: "#LME-10461", customerName: "Sophie Brennan", country: "GB", category: "wrong-item", severity: "normal", description: "Hair Edit box contained Smooth + Scalp Serums. Customer's hair profile shows Repair + Glow. Fulfilment mismatch.", resolution: "replacement", resolutionNotes: "Correct serums sent. Ops flagged to check May batch for further mismatches.", itemsAffected: ["Repair Serum x1", "Glow Serum x1"], agent: "demo" },
  { id: "demo-iss-004", createdAt: new Date("2026-05-22T11:20:00Z").toISOString(), orderId: "#LME-10447", customerName: "Marcus Webb", country: "AU", category: "leaked-sachet", severity: "high", description: "Scalp Serum bottle leaked inside sealed shipping box. Approximately 30% of product lost. Photos provided.", resolution: "refund", resolutionNotes: "Full refund processed due to extent of damage. Customer offered 20% discount on next order.", itemsAffected: ["Scalp Serum x1"], agent: "demo" },
  { id: "demo-iss-005", createdAt: new Date("2026-05-21T14:00:00Z").toISOString(), orderId: "#LME-10433", customerName: "Priya Nair", country: "AU", category: "damaged-item", severity: "normal", description: "Outer box arrived crushed — product intact but presentation damaged. Customer was gifting it.", resolution: "replacement", resolutionNotes: "Replacement sent in gift-ready packaging with handwritten note.", itemsAffected: ["Smooth Serum x1", "Glow Serum x1"], agent: "demo" },
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
