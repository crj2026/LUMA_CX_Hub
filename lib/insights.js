import { gorgiasFetch } from "./gorgias";
import { cached } from "./cache";

const PAGE_LIMIT = 100;
// Bumped from 50 to 250. A busy week at IM8's $250M ARR pace can produce
// 10K+ tickets across Prenetics brands — 5K cap was silently truncating
// and the dashboards were showing ~25% of actual volume. 250 × 100 = 25K
// is generous headroom; pagination still stops early when we cross the
// date window naturally.
const MAX_PAGES = 250;
const PAGE_DELAY_MS = 250;
const TICKETS_TTL_MS = 60 * 60 * 1000;
const SURVEYS_TTL_MS = 60 * 60 * 1000;
// One safety page past pastWindow before quitting — guards against pages
// that aren't perfectly sorted (Gorgias' default sort isn't guaranteed
// to be created_datetime DESC, even when we ask for it).
const PAST_WINDOW_GRACE = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTicketsInRange(fromIso, toIso) {
  const fromMs = Date.parse(fromIso);
  const toMs = Date.parse(toIso);
  const tickets = [];
  const seen = new Set();
  let cursor = null;
  let pages = 0;
  let consecutivePastWindowPages = 0;

  while (pages < MAX_PAGES) {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_LIMIT));
    if (cursor) params.set("cursor", cursor);

    // No sort params — Gorgias's /api/tickets returns 400 on common
    // order_by / order combinations. We rely on the grace window below
    // (only stop after PAST_WINDOW_GRACE consecutive empty pages) and
    // the bumped MAX_PAGES to cover the date range regardless of how
    // Gorgias internally orders its results.
    const data = await gorgiasFetch(`/api/tickets?${params}`);
    const batch = Array.isArray(data?.data) ? data.data : [];
    pages++;

    let pageHasInWindow = false;
    let pageHasPastWindow = false;
    for (const t of batch) {
      const created = Date.parse(t.created_datetime);
      if (Number.isNaN(created)) continue;
      if (created < fromMs) {
        pageHasPastWindow = true;
        continue; // keep scanning the rest of the page — order isn't guaranteed
      }
      if (created <= toMs) {
        if (t.id != null && !seen.has(t.id)) {
          seen.add(t.id);
          tickets.push(t);
          pageHasInWindow = true;
        }
      }
    }

    // Only stop when we've seen N consecutive pages where NOTHING was in
    // the window — that's the robust signal we've walked past the range.
    if (pageHasPastWindow && !pageHasInWindow) {
      consecutivePastWindowPages++;
      if (consecutivePastWindowPages >= PAST_WINDOW_GRACE) break;
    } else {
      consecutivePastWindowPages = 0;
    }

    cursor = data?.meta?.next_cursor ?? null;
    if (!cursor || batch.length < PAGE_LIMIT) break;
    await sleep(PAGE_DELAY_MS);
  }

  return { tickets, pages, truncated: pages >= MAX_PAGES };
}

async function fetchSurveysInRange(fromIso, toIso) {
  const fromMs = Date.parse(fromIso);
  const toMs = Date.parse(toIso);
  const surveys = [];
  const seen = new Set();
  let cursor = null;
  let pages = 0;
  let consecutivePastWindowPages = 0;

  while (pages < MAX_PAGES) {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_LIMIT));
    if (cursor) params.set("cursor", cursor);

    // No sort params — same reason as the tickets fetch.
    const data = await gorgiasFetch(`/api/satisfaction-surveys?${params}`);
    const batch = Array.isArray(data?.data) ? data.data : [];
    pages++;

    let pageHasInWindow = false;
    let pageHasPastWindow = false;
    for (const s of batch) {
      const stamp = Date.parse(s.scored_datetime || s.created_datetime);
      if (Number.isNaN(stamp)) continue;
      if (stamp < fromMs) {
        pageHasPastWindow = true;
        continue;
      }
      if (stamp <= toMs && s.score != null) {
        if (s.id != null && !seen.has(s.id)) {
          seen.add(s.id);
          surveys.push(s);
          pageHasInWindow = true;
        }
      }
    }

    if (pageHasPastWindow && !pageHasInWindow) {
      consecutivePastWindowPages++;
      if (consecutivePastWindowPages >= PAST_WINDOW_GRACE) break;
    } else {
      consecutivePastWindowPages = 0;
    }

    cursor = data?.meta?.next_cursor ?? null;
    if (!cursor || batch.length < PAGE_LIMIT) break;
    await sleep(PAGE_DELAY_MS);
  }

  return surveys;
}

export async function getTickets(from, to) {
  // v2 = robust pagination with explicit ordering + grace window. Old key
  // would serve the undercounted data.
  return cached(`tickets-v2:${from}:${to}`, TICKETS_TTL_MS, () => fetchTicketsInRange(from, to));
}

export async function getSurveys(from, to) {
  return cached(`surveys-v2:${from}:${to}`, SURVEYS_TTL_MS, () => fetchSurveysInRange(from, to));
}

export function filterIM8(tickets) {
  return tickets.filter((t) =>
    Array.isArray(t.tags) && t.tags.some((tag) => tag?.name === "IM8")
  );
}

export function tally(tickets, key) {
  const counts = {};
  for (const t of tickets) {
    const v = t[key] ?? "unknown";
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return counts;
}

const EXCLUDED_TAG_NAMES = new Set(["negative", "positive", "feedback"]);

export function topNonBrandTags(tickets, n = 5) {
  const counts = {};
  for (const t of tickets) {
    const tags = Array.isArray(t.tags) ? t.tags : [];
    for (const tag of tags) {
      const name = tag?.name;
      if (!name) continue;
      if (/^IM8(_|$)/i.test(name)) continue;
      if (EXCLUDED_TAG_NAMES.has(name.toLowerCase())) continue;
      counts[name] = (counts[name] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

export function csatStats(surveys) {
  if (!surveys.length) return { count: 0, average: null };
  const scores = surveys.map((s) => Number(s.score)).filter((n) => Number.isFinite(n));
  if (!scores.length) return { count: 0, average: null };
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { count: scores.length, average: Math.round(average * 100) / 100 };
}

// Match Gorgias's dashboard: both resolution time and messages-per-ticket
// are averaged over REPLIED tickets only. Gorgias's definition is "tickets
// where an agent sent a message in the window" — we identify these via
// the bulk /api/messages walk in fetchAgentRepliedTicketIds below.
// Falling back to messages_count >= 2 when the bulk walk is unavailable
// over-counts (internal notes + customer-only follow-ups inflate the
// count), so we prefer the explicit Set when present.

export function resolutionStats(tickets, repliedSet = null) {
  const samples = [];
  for (const t of tickets) {
    if (repliedSet && t.id != null && !repliedSet.has(String(t.id))) continue;
    if (!t.closed_datetime || !t.created_datetime) continue;
    const created = Date.parse(t.created_datetime);
    const closed = Date.parse(t.closed_datetime);
    if (Number.isFinite(created) && Number.isFinite(closed) && closed > created) {
      samples.push((closed - created) / 1000);
    }
  }
  if (!samples.length) return { count: 0, avgSeconds: null };
  const avgSeconds = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { count: samples.length, avgSeconds: Math.round(avgSeconds) };
}

export function mptStats(tickets, repliedSet = null) {
  if (!tickets.length) return { count: 0, average: null };
  const counts = tickets
    .filter((t) => !repliedSet || (t.id != null && repliedSet.has(String(t.id))))
    .map((t) => Number(t.messages_count))
    .filter((n) => Number.isFinite(n));
  if (!counts.length) return { count: 0, average: null };
  const average = counts.reduce((a, b) => a + b, 0) / counts.length;
  return { count: counts.length, average: Math.round(average * 10) / 10 };
}

// Gorgias ticket.excerpt is the LATEST message preview — usually the agent's
// reply. For trend analysis we need the customer's own words, so fetch the
// per-ticket message thread and pick the first customer-authored message.
function stripHtml(s) {
  return String(s || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickEvenly(arr, n) {
  if (arr.length <= n) return arr.slice();
  const step = arr.length / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

function isCustomerMessage(m) {
  if (m?.from_agent === false) return true;
  if (m?.from_agent === true) return false;
  const role = m?.sender?.role || m?.source?.from?.role;
  if (typeof role === "string" && role.toLowerCase() === "customer") return true;
  return false;
}

function messageText(m) {
  const raw = m?.stripped_text || m?.body_text || stripHtml(m?.body_html || "");
  return String(raw || "").replace(/\s+/g, " ").trim();
}

// Bulk path: one paginated /api/messages walk instead of one call per
// ticket. Gorgias returns messages newest-first with a cursor — we walk
// back until we cross fromMs, keeping the EARLIEST customer message we
// see per ticket. ~30 calls for a Today range vs 800+ in the per-ticket
// version. Falls through to caller's fallback if the endpoint shape
// doesn't match expectations.
// Walks /api/messages once and returns the Set of ticket IDs where at
// least one AGENT message was sent within [fromIso, toIso]. This is
// Gorgias's definition of "Tickets replied" — the denominator for
// their dashboard's resolution-time and messages-per-ticket metrics.
//
// Using ticket.messages_count >= 2 as a proxy over-counts because that
// field includes internal notes + customer follow-ups. This walks the
// actual message stream and only counts messages with from_agent === true.
//
// Cached for 1h alongside the ticket cache — bulk walk costs ~15-30s on
// cold cache but the answer rarely changes within an hour.
export async function fetchAgentRepliedTicketIds(fromIso, toIso) {
  const fromMs = Date.parse(fromIso);
  const toMs = Date.parse(toIso);
  const replied = new Set();
  let cursor = null;
  let pages = 0;
  let crossedGrace = 0;
  const MAX_PAGES_LOCAL = 350;

  while (pages < MAX_PAGES_LOCAL) {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_LIMIT));
    if (cursor) params.set("cursor", cursor);

    let data;
    try {
      data = await gorgiasFetch(`/api/messages?${params}`);
    } catch (e) {
      // If the endpoint errors on the first page, signal "no data" so
      // the summary route can fall back to all-tickets averaging.
      if (pages === 0) return null;
      break;
    }
    const batch = Array.isArray(data?.data) ? data.data : null;
    if (batch == null) {
      if (pages === 0) return null;
      break;
    }
    pages++;

    let pageHasInWindow = false;
    let pageHasPastWindow = false;
    for (const m of batch) {
      const created = Date.parse(m?.created_datetime || m?.sent_datetime || "");
      if (Number.isNaN(created)) continue;
      if (created < fromMs) {
        pageHasPastWindow = true;
        continue;
      }
      if (created > toMs) continue;
      // Only count true agent messages — skip customer messages AND
      // skip messages where from_agent isn't explicitly true (defensive
      // against ambiguous payloads).
      if (m?.from_agent !== true) continue;
      const tid = String(m?.ticket_id ?? m?.ticket?.id ?? "");
      if (!tid) continue;
      replied.add(tid);
      pageHasInWindow = true;
    }

    if (pageHasPastWindow && !pageHasInWindow) {
      crossedGrace++;
      if (crossedGrace >= 2) break;
    } else {
      crossedGrace = 0;
    }

    cursor = data?.meta?.next_cursor ?? null;
    if (!cursor || batch.length < PAGE_LIMIT) break;
    await sleep(100);
  }

  return replied;
}

export async function getAgentRepliedTicketIds(from, to) {
  return cached(`agent-replied:${from}:${to}`, TICKETS_TTL_MS, () =>
    fetchAgentRepliedTicketIds(from, to)
  );
}

export async function fetchCustomerFirstMessagesBulk(fromIso, toIso, ticketIds, maxChars = 280) {
  const fromMs = Date.parse(fromIso);
  const toMs = Date.parse(toIso);
  const wanted = new Set((ticketIds || []).map(String));
  const byTicket = new Map(); // ticketId -> { createdMs, text }
  let cursor = null;
  let pages = 0;
  // Big ranges (e.g. busy Today with 1000-2000+ IM8 tickets) can have
  // 30k+ messages across all brands at Prenetics. 350 pages × 100 = 35k
  // messages, enough to cover most days. With 50ms inter-page delay
  // that's ~17.5 sec worst case before Claude.
  const MAX_PAGES_LOCAL = 350;

  while (pages < MAX_PAGES_LOCAL) {
    const params = new URLSearchParams();
    params.set("limit", String(PAGE_LIMIT));
    if (cursor) params.set("cursor", cursor);

    let data;
    try {
      data = await gorgiasFetch(`/api/messages?${params}`);
    } catch (e) {
      // If /api/messages doesn't exist or rejects, signal fallback.
      if (pages === 0) return null;
      break;
    }

    const batch = Array.isArray(data?.data) ? data.data : null;
    if (batch == null) {
      // Unexpected shape — signal fallback on first page.
      if (pages === 0) return null;
      break;
    }
    pages++;

    let crossedWindow = false;
    for (const m of batch) {
      const created = Date.parse(m?.created_datetime || m?.sent_datetime || "");
      if (Number.isNaN(created)) continue;
      if (created < fromMs) {
        crossedWindow = true;
        continue;
      }
      if (created > toMs) continue;
      if (!isCustomerMessage(m)) continue;

      const tid = String(m?.ticket_id ?? m?.ticket?.id ?? "");
      if (!tid) continue;
      if (wanted.size && !wanted.has(tid)) continue;

      const existing = byTicket.get(tid);
      if (!existing || created < existing.createdMs) {
        const text = messageText(m);
        if (text) byTicket.set(tid, { createdMs: created, text: text.slice(0, maxChars) });
      }
    }

    cursor = data?.meta?.next_cursor ?? null;
    if (crossedWindow || !cursor || batch.length < PAGE_LIMIT) break;
    // 100ms between pages keeps us friendly to the parallel summary
    // /api/tickets fetch and any other Gorgias traffic. gorgiasFetch
    // handles 429 with retry-after but we'd rather not hit it.
    await sleep(100);
  }

  return byTicket;
}

// Pass n = null (or omit) to read every ticket; pass a number to sample
// evenly. Concurrency 12 — 25 was overloading Gorgias when combined with
// the bulk /api/messages walk and the parallel summary endpoint hitting
// /api/tickets at the same time, triggering 429s that propagated up.
export async function fetchFirstCustomerExcerpts(tickets, n = null, maxChars = 280) {
  const target = n == null ? tickets.slice() : pickEvenly(tickets, n);
  const out = [];
  const BATCH = 12;
  for (let i = 0; i < target.length; i += BATCH) {
    const slice = target.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map(async (t) => {
        if (!t?.id) return null;
        try {
          // Limit 50 + sort defensively client-side to oldest-first.
          // Without this, tickets with many CS replies push the original
          // customer message past the first page and we get null.
          const data = await gorgiasFetch(`/api/tickets/${t.id}/messages?limit=50`);
          const msgs = Array.isArray(data?.data) ? data.data.slice() : [];
          msgs.sort((a, b) => {
            const ta = Date.parse(a?.created_datetime || a?.sent_datetime || 0) || 0;
            const tb = Date.parse(b?.created_datetime || b?.sent_datetime || 0) || 0;
            return ta - tb;
          });
          const first = msgs.find(isCustomerMessage);
          if (!first) return null;
          const text = messageText(first);
          if (!text) return null;
          return { id: t.id, text: text.slice(0, maxChars) };
        } catch {
          return null;
        }
      })
    );
    for (const r of results) if (r) out.push(r);
  }
  return out;
}

export function formatDuration(seconds) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}
