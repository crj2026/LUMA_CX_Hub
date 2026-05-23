// Affiliate macro refinement — the "Refine this" chat affordance that
// sits under the structured suggestion card. The structured /suggest
// endpoint handles the 95% case — pick a macro, flag escalation, draft
// a holding reply. This endpoint handles the 5% where an agent needs
// to ask a follow-up (e.g. "make it shorter", "what if the affiliate
// is also a VIP?", "doesn't the May 13 SOP say differently?").
//
// Inputs: emailText, initialSuggestion (the JSON the agent already saw),
// and history (the running chat). Returns free prose, grounded in the
// same macros + decisions + tone guide as /suggest.
//
// Access: Lead Agent and above (same as /suggest).

import { auth, currentUser } from "@clerk/nextjs/server";
import { AFFILIATES_DATA } from "../../../../../lib/affiliates-data";
import { getRole, roleAtLeast } from "../../../../../lib/auth";
import { buildToneOfVoiceSection } from "../../../../../lib/tone-of-voice";

export const runtime = "nodejs";
export const maxDuration = 60;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 1200;

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
  return `You are helping a CX agent refine their response to an affiliate email.

The agent already received an initial structured suggestion (macro recommendation, escalation flag, summary, holding reply). They're now asking a follow-up. Your job: answer the follow-up in plain prose, still grounded in the playbook below.

RULES
- Only reference macros that exist in <macros>. NEVER invent macro names. If no macro fits, say so plainly.
- Stay in the brand voice — see the tone guide. If they ask you to rewrite a customer-facing reply, the rewrite MUST follow the tone-of-voice rules (no "I'm so sorry", no banned openers, no fabricated colour cues, etc).
- If their question requires escalation that wasn't already flagged, say so clearly with the right routing target (Sam / Kendra / Manager).
- Keep replies short — agents are triaging quickly. 2-4 sentences unless they ask for more.
- Don't restate the original suggestion verbatim. They've already seen it. Answer the follow-up.
- No JSON, no code fences. Free prose.

PRINCIPLES
${principles}

DECISION TREE
${decisions}

MACROS (your only allowed recommendations — exact name match required)
${macros}

VOICE REFERENCE
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
  const initialSuggestion = body.initialSuggestion ?? null;
  const history = Array.isArray(body.history) ? body.history : [];

  if (!emailText) {
    return Response.json({ error: "emailText required" }, { status: 400 });
  }
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return Response.json({ error: "history must end with a user message" }, { status: 400 });
  }
  // Cap history at a reasonable length to keep token use in check —
  // agents shouldn't be running 20-message chats for one ticket. If
  // they need that much back-and-forth, escalate.
  if (history.length > 12) {
    return Response.json({ error: "Chat too long — escalate the ticket instead." }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt();

  // Frame the conversation so Claude knows what context the agent already
  // has. The first synthetic user message lays out the email and the
  // initial structured suggestion; subsequent turns are the real chat.
  const contextMessage =
    `ORIGINAL AFFILIATE EMAIL:\n\n${emailText}\n\n` +
    `INITIAL STRUCTURED SUGGESTION (already shown to the agent):\n` +
    `${JSON.stringify(initialSuggestion ?? {}, null, 2)}\n\n` +
    `---\n\n` +
    `The agent now has follow-up questions. Reply in plain prose.`;

  const messages = [
    { role: "user", content: contextMessage },
    // Insert a synthetic assistant ack so Claude treats the context as
    // a prior turn rather than the agent's actual first question.
    { role: "assistant", content: "Got it. Ask away." },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    })),
  ];

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
        messages,
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
    const reply = (data.content?.[0]?.text ?? "").trim();

    return Response.json({
      reply,
      usage: data.usage ?? null,
    });
  } catch (err) {
    return Response.json({ error: err?.message || "LLM call failed" }, { status: 502 });
  }
}
