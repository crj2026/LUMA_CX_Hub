// Loop Returns API client.
// Loop's live customer data starts from 2026-05-06 — anything earlier is
// stale test data from the abandoned 2025 implementation. We hard-filter
// every read by this cutoff regardless of what the API returns.

export const LOOP_DATA_START = "2026-05-06T00:00:00Z";

function loopConfig() {
  const apiKey = process.env.LOOP_API_KEY;
  const base =
    (process.env.LOOP_API_BASE || "https://api.loopreturns.com").replace(/\/+$/, "");
  return { apiKey, base };
}

export function loopAvailable() {
  return Boolean(process.env.LOOP_API_KEY);
}

async function loopFetch(path, init = {}) {
  const { apiKey, base } = loopConfig();
  if (!apiKey) throw new Error("Loop credentials missing: set LOOP_API_KEY");
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = {
    Accept: "application/json",
    "X-Authorization": apiKey,
    ...(init.headers || {}),
  };
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const detail =
      typeof body === "object" && body !== null
        ? JSON.stringify(body).slice(0, 400)
        : String(body || res.statusText);
    throw new Error(`Loop ${res.status}: ${detail}`);
  }
  return body;
}

// Pull every Return created within [from, to] from /api/v2/returns.
// Pagination is offset-based — keep advancing offset by limit until the
// response data array shorter than limit signals the end.
export async function fetchReturns({ from, to }) {
  const start = new Date(Math.max(new Date(from).getTime(), new Date(LOOP_DATA_START).getTime())).toISOString();
  const end = new Date(to).toISOString();

  const all = [];
  const LIMIT = 100;
  const MAX_OFFSET = 10_000;
  let offset = 0;

  while (offset <= MAX_OFFSET) {
    const path = `/api/v2/returns?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}&filter=created_at&limit=${LIMIT}&offset=${offset}`;
    const body = await loopFetch(path);
    const items = body?.data ?? [];
    if (!Array.isArray(items) || items.length === 0) break;
    all.push(...items);
    if (items.length < LIMIT) break;
    offset += LIMIT;
  }

  // Hard cutoff — never include returns whose canonical timestamp predates the
  // live customer launch, no matter what Loop returns.
  const cutoff = new Date(LOOP_DATA_START).getTime();
  return all.filter((r) => {
    const t = new Date(r.created_at ?? r.createdAt ?? r.updated_at ?? 0).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}
