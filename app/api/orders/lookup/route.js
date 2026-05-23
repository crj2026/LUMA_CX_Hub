import { auth } from "@clerk/nextjs/server";
import { shopifyFetch } from "../../../../lib/shopify";
import { cached } from "../../../../lib/cache";

export const runtime = "nodejs";

function normalizeOrderId(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/\s+/g, "");
  if (!trimmed) return null;
  // Shopify order names usually carry the # prefix; Loop uses IM8-NNNN
  if (trimmed.startsWith("#")) return trimmed;
  if (/^\d+$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

// Map Shopify Location name → our standardized warehouse dropdown values.
// Aina (May 13) confirmed Shopify's fulfillment location is "GPS Warehouse"
// or similar — varies by 3PL. This normalizes whatever Shopify says into
// our 5 canonical values so Records/Reports group cleanly.
function mapLocationToWarehouse(locationName) {
  if (!locationName) return null;
  const lc = String(locationName).toLowerCase();
  // Order matters — specific before generic
  if (lc.includes("gps uk")) return "GPS UK";
  if (lc.includes("gps us")) return "GPS US";
  if (lc.includes("stord us")) return "Stord US";
  if (lc.includes("stord eu") || lc.includes("stord-eu")) return "Stord EU";
  if (lc.includes("stord")) return "Stord US"; // generic Stord defaults to US
  if (lc.includes("gps")) return "GPS UK"; // generic GPS defaults to UK (EU 3PL)
  if (lc.includes("hong kong") || lc.includes("hk warehouse") || lc.includes(" hk ") || lc.endsWith(" hk")) return "HK";
  if (lc.includes("extensiv")) return "HK"; // Extensiv = HK/EU per playbook toolkit
  return "Other";
}

// Cached map of Shopify Location ID → location name. Locations rarely
// change, so we cache for 1 hour. Survives container restarts via the
// CacheEntry table.
async function getShopifyLocationMap() {
  return cached("shopify-locations-v1", 60 * 60 * 1000, async () => {
    const { body } = await shopifyFetch("/locations.json");
    const map = {};
    for (const loc of body?.locations ?? []) {
      if (loc.id != null) map[loc.id] = loc.name || null;
    }
    return map;
  });
}

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = normalizeOrderId(searchParams.get("id"));
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  try {
    const params = new URLSearchParams({
      name: id,
      status: "any",
      limit: "1",
      // Added `fulfillments` (May 13, Aina's feedback) so we can derive
      // the actual fulfilling warehouse from Shopify rather than guessing
      // from country.
      fields: "id,name,email,customer,shipping_address,line_items,total_price,fulfillment_status,financial_status,created_at,tags,fulfillments",
    });
    const { body } = await shopifyFetch(`/orders.json?${params}`);
    const order = body?.orders?.[0];
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const customer = order.customer || {};
    const shipping = order.shipping_address || {};

    // Resolve warehouse from Shopify fulfillments. We look up the
    // location ID against a cached locations map (1hr TTL) then map
    // the location name to our 5 canonical warehouse buckets. If
    // anything fails (order not yet fulfilled, location lookup fails)
    // we just return null and let the client fall back to its country
    // heuristic.
    let warehouse = null;
    let locationName = null;
    try {
      const fulfillment = (order.fulfillments ?? [])[0];
      const locationId = fulfillment?.location_id;
      if (locationId != null) {
        const locMap = await getShopifyLocationMap();
        locationName = locMap?.[locationId] ?? null;
        warehouse = mapLocationToWarehouse(locationName);
      }
    } catch {
      // Non-fatal — just leave warehouse null
    }

    return Response.json({
      orderId: order.name,
      shopifyId: order.id,
      customerName:
        [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        [shipping.first_name, shipping.last_name].filter(Boolean).join(" ") ||
        null,
      customerEmail: order.email || customer.email || null,
      customerPhone: shipping.phone || customer.phone || null,
      country: shipping.country_code || shipping.country || null,
      warehouse,            // mapped to our dropdown values (Stord US/EU, GPS US/UK, HK, Other)
      locationName,         // raw Shopify location name (for debugging)
      shipping: {
        name: [shipping.first_name, shipping.last_name].filter(Boolean).join(" ") || null,
        address1: shipping.address1 || null,
        address2: shipping.address2 || null,
        city: shipping.city || null,
        state: shipping.province || shipping.province_code || null,
        zip: shipping.zip || null,
        country: shipping.country || shipping.country_code || null,
        phone: shipping.phone || null,
        email: order.email || customer.email || null,
      },
      lineItems: (order.line_items ?? []).map((li) => ({
        title: li.title,
        variantTitle: li.variant_title,
        quantity: li.quantity,
        sku: li.sku,
      })),
      total: order.total_price ? Number(order.total_price) : null,
      fulfillmentStatus: order.fulfillment_status,
      financialStatus: order.financial_status,
      tags: order.tags ? String(order.tags).split(",").map((t) => t.trim()).filter(Boolean) : [],
      createdAt: order.created_at,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
