import { auth } from "@clerk/nextjs/server";
import {
  getTickets,
  filterIM8,
  fetchFirstCustomerExcerpts,
  fetchCustomerFirstMessagesBulk,
} from "../../../../lib/insights";
import { cached } from "../../../../lib/cache";
import { isCronRequest } from "../../../../lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

const TRENDS_TTL_MS = 60 * 60 * 1000;
// Adaptive sampling: read every customer message when the range fits,
// fall back to a representative sample when the range is too big to
// fetch in time.
//   - <= READ_ALL_THRESHOLD: read all (Today usually fits here)
//   - > READ_ALL_THRESHOLD: per-ticket on a sample of SAMPLE_SIZE
// MAX_FOR_CLAUDE: upper cap on messages sent to Claude, regardless of
// path. 1000 short messages ≈ 70k tokens — well under Claude's context
// limit, gives much better trend signal than the old 250 cap, and only
// adds ~5-10s of Claude inference on top.
const READ_ALL_THRESHOLD = 1500;
const SAMPLE_SIZE = 250;
const MAX_FOR_CLAUDE = 1000;
const EXCERPT_MAX_CHARS = 280;
const QUOTE_MAX_CHARS = 240;

function parseRange(searchParams) {
  const to = searchParams.get("to") || new Date().toISOString();
  const from =
    searchParams.get("from") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

async function callClaude(systemPrompt, userContent, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}

function sampleEvenly(arr, n) {
  if (!Array.isArray(arr) || arr.length <= n) return arr.slice();
  const step = arr.length / n;
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

// Manus-style CS TLDR. Each trend has a punchy title, an estimated count
// (sample → total scale), 1-2 verbatim customer quotes, a business-signal
// interpretation, and a concrete action.
//
// CRITICAL: the input is the FIRST CUSTOMER MESSAGE for each ticket. These
// are the customer's own words — not CS agent replies. Quotes in the output
// must be verbatim from these inputs. If something sounds like a CS agent
// (uses "we", "our", "we apologize", "thanks for reaching out", policy
// explanations), it's a sourcing error — skip it and pick another quote.
const TLDR_SYSTEM = `You read FIRST-MESSAGE customer text from IM8 support tickets (a wellness supplement brand) and surface the top 3 trends for a daily CS digest. The format matches Cherie's previous Manus reports.

Output exactly this JSON, nothing else:
{
  "trends": [
    {
      "title": "<short headline phrase, 4-10 words, no count, no trailing period>",
      "sampleCount": <integer — your best estimate of how many of the sample messages fall in this trend>,
      "quotes": ["<verbatim CUSTOMER text>", "<optional second verbatim>"],
      "quoteSources": [<index of source message for first quote>, <index of source message for second quote>],
      "signal": "<1-2 sentences explaining what this trend means for the business — retention opportunity, quality issue, self-serve gap, ops fail, etc. Be specific.>",
      "action": "<1 sentence describing what's being done or should be done. Concrete, not platitudes.>"
    },
    { ... second trend ... },
    { ... third trend ... }
  ]
}

Rules:
- Exactly 3 trends, ranked by impact (volume first, business significance second).
- Title is a clean phrase. No counts in the title. No period at the end.
- quotes MUST be verbatim CUSTOMER words from the inputs. The inputs are customer messages — never CS agent replies. If a candidate quote sounds like a CS agent ("we apologize", "our policy", "thanks for reaching out", "I completely understand", "we're sorry to hear", "your order is being processed", "we have been experiencing"), DO NOT use it — find a different one. When in doubt, prefer first-person customer voice ("I", "my", "I want", "I need", "I haven't received").
- Each quote under ${QUOTE_MAX_CHARS} chars. Pick the 1-2 most illustrative.
- quoteSources MUST be the 1-based index numbers of the source messages you quoted from. Same length as quotes (one index per quote, in matching order). This lets the UI link each quote back to its Gorgias ticket.
- If you genuinely cannot find a verbatim customer quote for a trend, return an empty quotes array AND an empty quoteSources array rather than fabricating or paraphrasing.
- signal example: "Many of these are retention opportunities, not real cancellations." or "Recurring quality issue that hasn't been resolved." or "Self-serve gap forcing manual touches on the address change flow."
- action example: "Looking into the flavour swap portal issue." or "Worth flagging to warehouse for the next batch QC." or "Updating the macro to set clearer expectations on the veterans page."
- No personal names. No markdown. No bullets. No emojis. Pure JSON only.`;

async function computeTrends(from, to) {
  const ticketResult = await getTickets(from, to);
  const tickets = filterIM8(ticketResult.value.tickets);
  const totalTickets = tickets.length;
  if (!totalTickets) {
    return { trends: [], sampleSize: 0, totalTickets: 0, readAll: true };
  }
  // Adaptive: read every ticket when the range is small enough; sample
  // evenly when it's larger. Today usually fits the full-read path.
  const readAll = totalTickets <= READ_ALL_THRESHOLD;

  // Excerpts are { id, text } objects so we can attribute Claude's quotes
  // back to specific Gorgias tickets for clickable source links in the UI.
  let excerpts = [];
  let bulkUsed = false;
  try {
    const ticketIds = tickets.map((t) => t.id);
    const bulkMap = await fetchCustomerFirstMessagesBulk(from, to, ticketIds, EXCERPT_MAX_CHARS);
    if (bulkMap && bulkMap.size) {
      // Walk tickets in original order so the sample (if we slice) stays
      // representative chronologically.
      const collected = [];
      for (const t of tickets) {
        const hit = bulkMap.get(String(t.id));
        if (hit?.text) collected.push({ id: t.id, text: hit.text });
      }
      // Use bulk if we got reasonable coverage (>=25%). Below that the
      // dataset is too sparse to trust for trend analysis and we should
      // fall through to per-ticket. The threshold is intentionally low —
      // partial bulk coverage is still way faster than serial per-ticket.
      const minCoverage = Math.max(20, Math.ceil(totalTickets * 0.25));
      if (collected.length >= minCoverage) {
        // Send the full bulk output to Claude unless it would exceed
        // MAX_FOR_CLAUDE — much better signal than the old hard 250 cap.
        excerpts = collected.length > MAX_FOR_CLAUDE
          ? sampleEvenly(collected, MAX_FOR_CLAUDE)
          : collected;
        bulkUsed = true;
      }
    }
  } catch {
    // bulk path errored — fall through to per-ticket
  }

  // Strategy 2 (fallback): per-ticket /api/tickets/{id}/messages fetches.
  if (!bulkUsed) {
    const limit = readAll ? null : SAMPLE_SIZE;
    excerpts = await fetchFirstCustomerExcerpts(tickets, limit, EXCERPT_MAX_CHARS);
  }

  if (!excerpts.length) {
    return { trends: [], sampleSize: 0, totalTickets, readAll: false };
  }

  // "Exact" only when we actually got near-complete coverage of the
  // tickets in range. Bulk often returns partial coverage on big days
  // (Gorgias paginates back through ALL brands' messages and we cap
  // pages), so we treat anything below 95% as a sample and scale.
  const coverage = excerpts.length / totalTickets;
  const isExact = coverage >= 0.95;

  const sourceLabel = isExact
    ? `Read every ticket: ${excerpts.length} customer first-messages from ${totalTickets} tickets.`
    : `Sample size: ${excerpts.length} customer first-messages from ${totalTickets} tickets.`;

  const userContent =
    `Total tickets in period: ${totalTickets}.\n` +
    `${sourceLabel}\n\n` +
    `Customer messages (verbatim, customer voice only). Each is numbered — when you quote one, also include its number in quoteSources:\n\n` +
    excerpts.map((e, i) => `${i + 1}. ${e.text}`).join("\n");

  const raw = await callClaude(TLDR_SYSTEM, userContent, 1500);
  const json = extractJson(raw);
  const rawTrends = Array.isArray(json.trends) ? json.trends.slice(0, 3) : [];

  // When coverage is essentially complete, sampleCount IS the trend count.
  // Otherwise scale proportionally — even bulk results need scaling when
  // we only got partial coverage of a busy day.
  const trends = rawTrends.map((t) => {
    const sampleCount = Number(t.sampleCount) || 0;
    const estTotal = isExact
      ? sampleCount
      : excerpts.length
        ? Math.round((sampleCount / excerpts.length) * totalTickets)
        : 0;
    const estPct = totalTickets
      ? Math.round((estTotal / totalTickets) * 100)
      : 0;
    const cleanQuotes = Array.isArray(t.quotes)
      ? t.quotes
          .map((q) => String(q || "").trim().slice(0, QUOTE_MAX_CHARS))
          .filter(Boolean)
          .slice(0, 2)
      : [];
    // Map Claude's 1-based source indexes back to Gorgias ticket IDs so
    // the UI can render each quote as a link to its source ticket. We
    // align with cleanQuotes by index — same length, matching positions.
    const sourceIdxs = Array.isArray(t.quoteSources) ? t.quoteSources : [];
    const quoteTicketIds = cleanQuotes.map((_, i) => {
      const idx = Number(sourceIdxs[i]);
      if (!Number.isFinite(idx) || idx < 1 || idx > excerpts.length) return null;
      return excerpts[idx - 1]?.id ?? null;
    });
    return {
      title: String(t.title || "").trim().replace(/\.$/, ""),
      sampleCount,
      estTotal,
      estPct,
      quotes: cleanQuotes,
      quoteTicketIds,
      signal: String(t.signal || "").trim(),
      action: String(t.action || "").trim(),
    };
  });

  // readAll in the response means "counts are exact" to the frontend.
  // We tie it to actual coverage, not to whether we attempted full read.
  return { trends, sampleSize: excerpts.length, totalTickets, readAll: isExact };
}

export async function GET(req) {
  if (!isCronRequest(req)) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(searchParams);
  // v9 = quotes carry quoteTicketIds for source-ticket links in the UI.
  const cacheKey = `trends-tldr-v9:${from}:${to}`;
  try {
    const { value, fromCache } = await cached(cacheKey, TRENDS_TTL_MS, () =>
      computeTrends(from, to)
    );
    return Response.json({ ...value, from, to, fromCache });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
