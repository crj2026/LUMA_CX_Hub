import { auth } from "@clerk/nextjs/server";
import { shopifyFetch, shopifyConfig } from "../../../../lib/shopify";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = shopifyConfig();
  try {
    const { body } = await shopifyFetch("/shop.json");
    const shop = body?.shop ?? {};
    return Response.json({
      ok: true,
      store: cfg.store,
      version: cfg.version,
      name: shop.name ?? null,
      domain: shop.domain ?? null,
      currency: shop.currency ?? null,
      planName: shop.plan_name ?? null,
    });
  } catch (err) {
    return Response.json({ ok: false, store: cfg.store, version: cfg.version, error: err.message });
  }
}
