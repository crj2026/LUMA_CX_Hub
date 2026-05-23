import { auth } from "@clerk/nextjs/server";
import { skioConfig } from "../../../../../lib/skio";

export const runtime = "nodejs";

// Lean cancel-flow probe. Each probe runs independently — if any hangs or
// errors the others still return. We just want to know which session table
// to use and what the reason field is called.

async function rawSkio(query) {
  const { url, token } = skioConfig();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `API ${token}` },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { rawText: text.slice(0, 500) }; }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { siteId } = skioConfig();
  if (!siteId) return Response.json({ error: "SKIO_SITE_ID missing" }, { status: 503 });

  // Introspection cracked the schema:
  //   V3Session has pathTaken — the customer's journey through the flow
  //   V2Reason.reason — the customer-facing reason text
  //   V2Reason.cancelFlowId — links sessions and reasons via the same flow
  // Final probe: dump a real V3Session with pathTaken + recent rows, plus
  // a V2Reason sample with its text, so we can see exactly how to join.
  const probes = {
    "v3_full_with_pathTaken": `
      query { CancelFlowV3Session(
        where: { siteId: {_eq: "${siteId}"}, createdAt: {_gte: "2026-04-25T00:00:00Z"} },
        limit: 5,
        order_by: { createdAt: desc }
      ) {
        id createdAt pathTaken status type cancelFlowId subscriptionId
      } }`,
    "v2_reason_with_reason_text": `
      query { CancelFlowV2Reason(limit: 5) {
        id reason cancelFlowId enabled
      } }`,
    "v2_reason_for_im8_flow": `
      query { CancelFlowV2Reason(
        where: { enabled: {_eq: true} },
        limit: 20
      ) { id reason cancelFlowId } }`,
  };

  const out = {};
  await Promise.all(Object.entries(probes).map(async ([key, q]) => {
    try {
      const r = await rawSkio(q);
      if (r.errors) {
        out[key] = { errors: r.errors.map((e) => e.message) };
      } else {
        out[key] = { ok: true, sample: r.data };
      }
    } catch (e) {
      out[key] = { error: String(e.message ?? e) };
    }
  }));
  return Response.json(out);
}
