// Affiliate macro suggestion — Stage 2 of the affiliates rollout.
// POST { emailText } → returns a structured suggestion:
//   recommendedMacro, escalate, rationale, flagsForAgent, confidence.
//
// Grounded against AFFILIATES_DATA so the model can ONLY recommend
// macro names that actually exist in our library. The system prompt
// also encodes Cherie's policy gates (e.g., reward tiers aren't public
// yet — don't proactively mention them).
//
// Access: Lead Agent and above (matches the Affiliates tab gate).

import { auth, currentUser } from "@clerk/nextjs/server";
import { AFFILIATES_DATA } from "../../../../lib/affiliates-data";
import { getRole, roleAtLeast } from "../../../../lib/auth";
import { buildToneOfVoiceSection } from "../../../../lib/tone-of-voice";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 800;

// Build the grounding sections for the system prompt. We feed every
// macro name + trigger (so the model can match) but NOT the full
// response bodies (saves tokens; the body lives in the UI / Gorgias).
function buildGroundingPrompt() {
  const principles = (AFFILIATES_DATA.principles ?? [])
    .map((p) => `• ${p.title}: ${p.body}`)
    .join("\n");

  const decisions = (AFFILIATES_DATA.decisions ?? [])
    .map((d) => {
      const flag = String(d.escalate || "").toLowerCase();
      const esc = flag.includes("flag") || flag.includes("escalate") ? " [ESCALATE]" : "";
      return `${d.num}. ${d.trigger}${esc}\n   Tag: ${d.tag}\n   Approach: ${d.approach}`;
    })
    .join("\n\n");

  const macros = (AFFILIATES_DATA.macros ?? [])
    .flatMap((cat) =>
      cat.items.map(
        (m) =>
          `"${m.gorgiasMacro}" [${m.inGorgias ? "in Gorgias" : "paste body"}]\n   Trigger: ${m.trigger}`
      )
    )
    .join("\n\n");

  return { principles, decisions, macros };
}

function buildSystemPrompt() {
  const { principles, decisions, macros } = buildGroundingPrompt();
  const toneGuide = buildToneOfVoiceSection();
  return `You are an AI assistant for IM8 CS agents handling affiliate emails on the IM8 Health affiliate program.

GOAL
Given an affiliate's email or question, recommend the right Gorgias macro and flag any escalation. The agent will use your suggestion to reply faster.

OUTPUT FORMAT
Return ONLY a single JSON object. No prose before or after. No code fences. Just the JSON.

SCHEMA
{
  "summary": "1-2 sentences in PLAIN ENGLISH describing what the affiliate is asking. Always populated, regardless of macro match.",
  "recommendedMacro": {
    "name": "exact Gorgias macro name from <macros> below",
    "inGorgias": boolean
  } | null,
  "suggestedResponse": "string OR null. Populated ONLY when recommendedMacro is null AND escalation is required. A brief 2-3 sentence holding reply the agent can copy verbatim while the case routes — written in the IM8 tone-of-voice (warm, direct, no 'I'm so sorry', no banned openers). Always finish with a 'someone will come back to you within one business day' beat. Leave as null when a macro IS recommended.",
  "escalate": {
    "required": boolean,
    "to": "Sam" | "Kendra" | "Manager" | null,
    "reason": "1-sentence reason, or null"
  },
  "rationale": "1-2 sentences explaining your match OR why you couldn't find one. Cite the decision-tree row number or program rule when relevant.",
  "flagsForAgent": ["array of additional notes for the agent — policy reminders, sensitivities. Empty array if nothing else"],
  "confidence": "high" | "medium" | "low"
}

RULES
1. Recommend ONLY macros that appear in <macros> below. Never invent names.
2. Match the affiliate's email content to a row in <decisions> first to identify the email type, then pick the matching macro by tag or topic.
3. POLICY — reward tiers (activation reward, 3rd lifetime sale, 10th lifetime sale, monthly performance rewards) are NOT yet publicly announced to affiliates. Do NOT recommend any reward macro unless the affiliate has explicitly asked about a reward, milestone, free product, or specific sale count. If the affiliate's email is generic (e.g., new signup), surface a "Don't bring up reward tiers — not yet announced" item in flagsForAgent.
4. ESCALATION routing:
   - Paid partnership / sponsorship / talent manager / retail / wholesale → escalate.to = "Sam"
   - Platform-migration complaints / commission increase requests over 50k revenue / Loop bugs → escalate.to = "Kendra"
   - Anything else that needs a flag (legacy reward claims, disputed amounts, anything outside the SOP) → escalate.to = "Manager"
   - If escalation is needed, also set rationale to explain why.
5. CONFIDENCE:
   - "high" — unambiguous match, single clear macro fits, no escalation oddities
   - "medium" — match exists but the email has some ambiguity
   - "low" — the email is unclear, fits multiple macros, or doesn't match any pattern
6. MACRO-vs-ESCALATION decision (critical):
   - If the email asks about something covered by a macro (payout question, link issue, FTC, content, etc.) AND no escalation is needed → recommend the macro. recommendedMacro = the macro. suggestedResponse = null.
   - If the email asks about something operational that ISN'T covered by any macro (challenge round status, Creator Challenge feedback, disputed amount, anything outside the standard SOP) → DO NOT force-fit a macro. recommendedMacro = null. suggestedResponse = a brief holding reply the agent can paste. escalate.required = true with the right "to".
   - DO NOT recommend a macro AND escalate at the same time when the macro doesn't actually answer the affiliate's question. That confuses agents (Cherie's feedback May 18). Choose one path: macro OR no-macro+holding-reply+escalation. Never both.
   - If you're tempted to recommend a macro "for context" while also escalating — set recommendedMacro = null instead.
7. ALWAYS populate the "summary" field — even when escalating. This is the plain-English read of what the affiliate is asking, separate from your reasoning.

GUIDING PRINCIPLES (the IM8 voice when the agent edits the macro before sending)
${principles}

DECISION TREE (use this to identify email type and escalation flags)
${decisions}

MACROS (your only allowed recommendations — exact name match required)
${macros}

VOICE REFERENCE
The chosen macro body and any wording you suggest in rationale/flagsForAgent must respect the canonical IM8 tone-of-voice guide below. The macros in this library have already been tone-warmed, but if you ever quote or rewrite copy, follow these rules.

${toneGuide}
`;
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Lead Agent")) {
    return Response.json({ error: "Forbidden — Lead Agent role required" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server is missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const emailText = String(body.emailText ?? "").trim();
  if (!emailText) {
    return Response.json({ error: "emailText required" }, { status: 400 });
  }
  // Soft cap on input — 30k chars is way more than any real affiliate
  // email and keeps the token budget predictable.
  if (emailText.length > 30000) {
    return Response.json({ error: "Email text too long (max 30,000 chars)" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt();

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `AFFILIATE EMAIL:\n\n${emailText}\n\nReturn the JSON suggestion now.`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return Response.json(
        { error: err.error?.message || `Anthropic API error ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const text = data.content?.[0]?.text?.trim() ?? "";

    // Best-effort parse — Claude is usually well-behaved when asked
    // for JSON-only, but strip code fences just in case.
    let parsed = null;
    let parseError = null;
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parseError = e.message;
    }

    return Response.json({
      suggestion: parsed,
      rawText: parsed ? null : text, // surface raw text only on parse failure
      parseError,
      usage: data.usage ?? null,
    });
  } catch (err) {
    return Response.json({ error: err?.message || "LLM call failed" }, { status: 502 });
  }
}
