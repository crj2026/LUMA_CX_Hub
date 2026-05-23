import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-can-001", createdAt: new Date("2026-05-23T08:55:00Z").toISOString(), orderId: "#LME-10476", customerName: "Amelia Cross", country: "AU", reason: "too-expensive", retentionOffer: "Pause offer (2 months) + 10% loyalty discount on return", retentionOutcome: "saved", notes: "Customer agreed to a 2-month pause. Will reactivate in August. Discount code sent for when she returns.", agent: "demo" },
  { id: "demo-can-002", createdAt: new Date("2026-05-22T13:40:00Z").toISOString(), orderId: "#LME-10451", customerName: "Daniel Torres", country: "US", reason: "wrong-serums", retentionOffer: "Immediate serum swap — updated hair profile from Smooth to Repair", retentionOutcome: "saved", notes: "Customer had colour-treated hair but was receiving Smooth Serum. Updated profile, swapped to Repair + Glow. Very happy.", agent: "demo" },
  { id: "demo-can-003", createdAt: new Date("2026-05-22T10:15:00Z").toISOString(), orderId: "#LME-10448", customerName: "Niamh O'Sullivan", country: "GB", reason: "not-using-fast-enough", retentionOffer: "Skip 1 month offered", retentionOutcome: "saved", notes: "Customer still has 2 bottles from last box. Switched to bi-monthly shipping. Happy to continue at reduced frequency.", agent: "demo" },
  { id: "demo-can-004", createdAt: new Date("2026-05-21T16:20:00Z").toISOString(), orderId: "#LME-10438", customerName: "Ryan Kowalski", country: "US", reason: "no-results-seen", retentionOffer: "Timeline education + application routine check + formula review", retentionOutcome: "declined", notes: "Customer at 6 weeks with no visible change. Checked application — was applying to dry hair instead of damp. Explained, but they declined. Full refund processed.", agent: "demo" },
  { id: "demo-can-005", createdAt: new Date("2026-05-21T09:30:00Z").toISOString(), orderId: "#LME-10425", customerName: "Isla Mackenzie", country: "AU", reason: "personal-life-change", retentionOffer: "Pause offer", retentionOutcome: "declined", notes: "Customer moving overseas. Declined pause — didn't want to manage it remotely. Cancelled with warm sendoff.", agent: "demo" },
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
