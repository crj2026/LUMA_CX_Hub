import { auth, currentUser } from "@clerk/nextjs/server";
import { getRole, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

const CANDIDATES = [
  "/api/v1/returns?limit=1",
  "/v1/returns?limit=1",
  "/api/v2/returns?limit=1",
  "/v2/returns?limit=1",
  "/api/returns?limit=1",
  "/returns?limit=1",
  "/api/v1/return?limit=1",
  "/api/v1/returns/list?limit=1",
  "/api/v1/orders?limit=1",
  "/api/v1",
  "/",
];

const AUTH_HEADERS = {
  "X-Authorization": "x-auth",
  "Authorization-Bearer": "bearer",
  "Authorization-Plain": "plain",
};

async function probe(base, path, key, headerKind) {
  let headers = { Accept: "application/json" };
  if (headerKind === "x-auth") headers["X-Authorization"] = key;
  if (headerKind === "bearer") headers["Authorization"] = `Bearer ${key}`;
  if (headerKind === "plain") headers["Authorization"] = key;
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 200); }
    return {
      url,
      headerKind,
      status: res.status,
      ok: res.ok,
      bodyPreview: typeof body === "object" ? JSON.stringify(body).slice(0, 300) : body,
    };
  } catch (e) {
    return { url, headerKind, status: 0, ok: false, error: e.message };
  }
}

async function fetchSample(base, key) {
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 86400000);
  const url = `${base}/api/v2/returns?from=${monthAgo.toISOString()}&to=${today.toISOString()}&filter=created_at&limit=50&offset=0`;
  try {
    const res = await fetch(url, { headers: { "X-Authorization": key, Accept: "application/json" } });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 400); }
    if (!res.ok) return { url, status: res.status, error: body };
    const rows = body?.data ?? [];
    const closed = rows.find((r) => r.state === "closed" && r.outcome === "refund" && Number(r.refund) > 0);
    const lineItemKeys = closed?.line_items?.[0] ? Object.keys(closed.line_items[0]).sort() : [];
    const titles = (closed?.line_items ?? []).map((li) =>
      li.title ?? li.name ?? li.product_title ?? li.product_name ?? "(no title field)"
    );
    // Dump every reason-related path we can find on each line item
    const reasonFieldDump = (closed?.line_items ?? []).map((li) => ({
      title: li.title ?? li.name,
      reason: li.reason,
      return_reason: li.return_reason,
      reason_name: li.reason_name,
      return_reason_name: li.return_reason_name,
      policy_reason: li.policy_reason,
    }));
    return {
      url,
      status: res.status,
      total: rows.length,
      states: [...new Set(rows.map((r) => r.state))],
      outcomes: [...new Set(rows.map((r) => r.outcome))],
      closedRefundFound: !!closed,
      closedRefund: closed
        ? { id: closed.id, refund: closed.refund, lineItemKeys, titles, reasonFieldDump }
        : null,
    };
  } catch (e) {
    return { url, error: e.message };
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Lead Agent")) {
    return Response.json({ error: "Forbidden — Lead Agent role required" }, { status: 403 });
  }

  const apiKey = process.env.LOOP_API_KEY;
  if (!apiKey) return Response.json({ error: "LOOP_API_KEY missing" }, { status: 503 });
  const base =
    (process.env.LOOP_API_BASE || "https://api.loopreturns.com").replace(/\/+$/, "");

  const sample = await fetchSample(base, apiKey);
  return Response.json({ base, sample });
}
