import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Demo mock — returns a plausible order without calling Shopify. The
// profile rotates deterministically on the digits of the order id so
// lookups demo all three markets (and therefore all three warehouses).
const DEMO_ORDERS = [
  { customerName: "Chloe Fitzpatrick", customerEmail: "chloe.fitzpatrick@example.com", country: "AU", currency: "AUD", lineItems: [{ title: "The Hair Edit (Subscription Box)", quantity: 1, price: "89.00" }], totalPrice: "89.00" },
  { customerName: "James Okafor", customerEmail: "james.okafor@example.com", country: "US", currency: "USD", lineItems: [{ title: "Repair Serum", quantity: 1, price: "85.00" }], totalPrice: "85.00" },
  { customerName: "Sophie Brennan", customerEmail: "sophie.brennan@example.com", country: "GB", currency: "GBP", lineItems: [{ title: "Smooth Serum", quantity: 1, price: "79.00" }, { title: "Glow Serum", quantity: 1, price: "75.00" }], totalPrice: "154.00" },
];

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id") || searchParams.get("orderId") || "#LME-10500";
  const digits = orderId.replace(/\D/g, "");
  const profile = DEMO_ORDERS[(digits ? parseInt(digits.slice(-2), 10) : 0) % DEMO_ORDERS.length];
  return Response.json({
    orderId,
    ...profile,
    status: "fulfilled",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
