import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  {
    id: "demo-ar-001",
    createdAt: new Date("2026-05-22T10:20:00Z").toISOString(),
    orderId: "#LME-10453",
    customerName: "Tara Hennessy",
    country: "AU",
    complaintMethod: "email",
    complaintDescription: "The tingling on my scalp feels like burning — it's really painful, not just a tingle. I had to wash it off immediately.",
    productsAffected: ["Scalp Serum"],
    lotNumbers: ["LS-2605-A"],
    symptoms: ["Rash", "Allergic reaction"],
    severity: "moderate",
    isSerious: false,
    escalatedTo: "Head of CX",
    fdaMedwatchFiled: false,
    mrddNumber: "",
    returnRequested: false,
    rmaNumber: "",
    status: "closed",
    agent: "demo",
  },
  {
    id: "demo-ar-002",
    createdAt: new Date("2026-05-20T13:45:00Z").toISOString(),
    orderId: "#LME-10399",
    customerName: "Ben Cartwright",
    country: "US",
    complaintMethod: "live-chat",
    complaintDescription: "Mild itching on scalp during first week of Scalp Serum use. Resolved after reducing application to 2x per week.",
    productsAffected: ["Scalp Serum"],
    lotNumbers: ["LS-2604-B"],
    symptoms: ["Rash"],
    severity: "low",
    isSerious: false,
    escalatedTo: "",
    fdaMedwatchFiled: false,
    mrddNumber: "",
    returnRequested: false,
    rmaNumber: "",
    status: "closed",
    agent: "demo",
  },
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
