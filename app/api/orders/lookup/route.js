import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Demo mock — returns a plausible order without calling Shopify.
export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") || "#DTC-00000";
  return Response.json({
    orderId,
    customerName: "Demo Customer",
    customerEmail: "demo@example.com",
    country: "US",
    status: "fulfilled",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [{ title: "[Client Product A]", quantity: 1, price: "89.00" }],
    totalPrice: "89.00",
    currency: "USD",
  });
}
