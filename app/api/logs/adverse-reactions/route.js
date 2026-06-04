import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SEED_ROWS = [
  {
    id: "demo-ar-001",
    createdAt: new Date("2026-05-22T10:20:00Z").toISOString(),
    orderId: "#ORD-10453",
    customerName: "[Customer name]",
    country: "AU",
    complaintMethod: "email",
    complaintDescription: "[Customer's description of the reaction, in their words.]",
    productsAffected: ["[Product]"],
    lotNumbers: ["[LOT-0000-A]"],
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
    orderId: "#ORD-10399",
    customerName: "[Customer name]",
    country: "US",
    complaintMethod: "live-chat",
    complaintDescription: "[Customer's description of the reaction, in their words.]",
    productsAffected: ["[Product]"],
    lotNumbers: ["[LOT-0000-B]"],
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
