// [BRAND_NAME] tone-of-voice guide.
//
// CANONICAL voice source — consumed by the AI surfaces (Ask AI + the
// Affiliates suggestion endpoints) via buildToneOfVoiceSection(). This
// file has outsized effect on AI output quality, so rewrite it carefully
// in the brand's real voice. PLACEHOLDER CONTENT below — see BRAND_SETUP.md.

export const TONE_VERSION = "brand-template-v1";

export const VOICE_ONE_SENTENCE =
  "[One sentence describing how the brand sounds — e.g. warm, clear, confident, never corporate or over-apologetic.]";

export const CORE_PRINCIPLES = [
  {
    name: "[Principle 1 — e.g. Sound like a person, not a policy doc]",
    body: "[What this means in practice.]",
  },
  {
    name: "[Principle 2 — e.g. Make it personal]",
    body: "[What this means in practice.]",
  },
  {
    name: "[Principle 3 — e.g. Solve, don't over-apologise]",
    body: "[What this means in practice.]",
  },
  {
    name: "[Principle 4 — e.g. Get to the point]",
    body: "[What this means in practice.]",
  },
  {
    name: "[Principle 5 — e.g. Acknowledge before you answer]",
    body: "[What this means in practice.]",
  },
];

export const OPENERS = {
  avoid: [
    "[Phrase to avoid 1 — e.g. 'I hope this email finds you well.']",
    "[Phrase to avoid 2 — e.g. 'We apologise for any inconvenience.']",
    "[Phrase to avoid 3]",
    "[Phrase to avoid 4]",
  ],
  prefer: [
    "[Preferred opener 1]",
    "[Preferred opener 2]",
    "[Preferred opener 3]",
  ],
};

export const VOICE_BY_SITUATION = [
  { situation: "Complaint",        approach: "[How to sound when handling a complaint.]" },
  { situation: "Safety / urgent",  approach: "[How to sound for urgent or safety issues.]" },
  { situation: "Cancel save",      approach: "[How to sound during a save attempt.]" },
  { situation: "Product question", approach: "[How to sound when answering product questions.]" },
  { situation: "Compliment",       approach: "[How to sound when receiving praise.]" },
];

export function buildToneOfVoiceSection() {
  return [
    "=== [BRAND_NAME] TONE OF VOICE ===",
    VOICE_ONE_SENTENCE,
    "",
    ...CORE_PRINCIPLES.map(p => `• ${p.name}: ${p.body}`),
    "",
    "Avoid: " + OPENERS.avoid.join(" | "),
    "",
    "Prefer openers like: " + OPENERS.prefer.join(" | "),
    "",
    "Tone by situation:",
    ...VOICE_BY_SITUATION.map(v => `• ${v.situation}: ${v.approach}`),
  ].join("\n");
}
