import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// PLACEHOLDER demo cancellation rows — shown when the table is empty.
const SEED_ROWS = [
  { id: "demo-can-001", createdAt: new Date("2026-05-23T08:55:00Z").toISOString(), orderId: "#ORD-10476", customerName: "[Customer name]", country: "AU", reason: "too-expensive", retentionOffer: "[Save play offered]", retentionOutcome: "saved", notes: "[What happened.]", agent: "demo" },
  { id: "demo-can-002", createdAt: new Date("2026-05-22T13:40:00Z").toISOString(), orderId: "#ORD-10451", customerName: "[Customer name]", country: "US", reason: "wrong-product", retentionOffer: "[Save play offered]", retentionOutcome: "saved", notes: "[What happened.]", agent: "demo" },
  { id: "demo-can-003", createdAt: new Date("2026-05-22T10:15:00Z").toISOString(), orderId: "#ORD-10448", customerName: "[Customer name]", country: "GB", reason: "not-using-fast-enough", retentionOffer: "[Save play offered]", retentionOutcome: "saved", notes: "[What happened.]", agent: "demo" },
  { id: "demo-can-004", createdAt: new Date("2026-05-21T16:20:00Z").toISOString(), orderId: "#ORD-10438", customerName: "[Customer name]", country: "US", reason: "no-results-seen", retentionOffer: "[Save play offered]", retentionOutcome: "declined", notes: "[What happened.]", agent: "demo" },
  { id: "demo-can-005", createdAt: new Date("2026-05-21T09:30:00Z").toISOString(), orderId: "#ORD-10425", customerName: "[Customer name]", country: "AU", reason: "personal-life-change", retentionOffer: "[Save play offered]", retentionOutcome: "declined", notes: "[What happened.]", agent: "demo" },
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
