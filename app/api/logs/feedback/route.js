import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  { id: "demo-fb-001", createdAt: new Date("2026-05-23T11:30:00Z").toISOString(), orderId: "#LME-10480", customerName: "Georgia Whitfield", country: "AU", type: "positive", channel: "email", summary: "Customer emailed unprompted to say her hair is 'completely transformed' after 6 weeks of Repair Serum. Previously had very damaged bleached hair. Wants to share her experience.", trustpilotPrompted: true, agent: "demo" },
  { id: "demo-fb-002", createdAt: new Date("2026-05-22T09:10:00Z").toISOString(), orderId: "#LME-10449", customerName: "Liam O'Brien", country: "GB", type: "negative", channel: "chat", summary: "Customer unhappy that the Scalp Serum tingling was not mentioned prominently on the product page. Felt 'alarmed' the first time it happened. Agreed it was fine once explained, but wants better upfront communication.", trustpilotPrompted: false, agent: "demo" },
  { id: "demo-fb-003", createdAt: new Date("2026-05-21T14:50:00Z").toISOString(), orderId: "#LME-10421", customerName: "Fatima Al-Hassan", country: "US", type: "feature-request", channel: "email", summary: "Customer requesting travel-size versions of Smooth and Glow Serums. Says she loves the products but can't take full bottles in hand luggage.", trustpilotPrompted: false, agent: "demo" },
  { id: "demo-fb-004", createdAt: new Date("2026-05-20T16:00:00Z").toISOString(), orderId: "#LME-10408", customerName: "Zoe Andersen", country: "AU", type: "positive", channel: "instagram", summary: "Customer DM'd on Instagram saying she recommended LUMÉ to 4 friends this week after seeing results from Glow Serum. Referral code given.", trustpilotPrompted: true, agent: "demo" },
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
