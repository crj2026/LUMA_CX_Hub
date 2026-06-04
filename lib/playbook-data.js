// [BRAND_NAME] CX Playbook — brand content.
//
// ─────────────────────────────────────────────────────────────────────
// PLACEHOLDER CONTENT — replace everything in [SQUARE_BRACKETS] with the
// brand's real products, policies, and FAQs. Keep the data shapes intact
// (the UI in app/AppClient.jsx reads these exact fields) and the hub will
// keep rendering. See BRAND_SETUP.md for the full checklist.
// ─────────────────────────────────────────────────────────────────────

// ─── Non-Negotiables ──────────────────────────────────────────────────
// The brand's hard rules. severity: "high" | "med".

export const NON_NEGOTIABLES = [
  {
    title: "[Non-negotiable rule 1 — e.g. Never minimise a safety report]",
    detail: "[What the agent must do, and why. One or two sentences.]",
    severity: "high",
  },
  {
    title: "[Non-negotiable rule 2 — e.g. Never give medical/professional advice]",
    detail: "[What the agent must do, and why.]",
    severity: "high",
  },
  {
    title: "[Non-negotiable rule 3 — e.g. Always check the order before promising a refund]",
    detail: "[What the agent must do, and why.]",
    severity: "high",
  },
  {
    title: "[Non-negotiable rule 4 — e.g. Photo required for damage/quality claims]",
    detail: "[What the agent must do, and why.]",
    severity: "med",
  },
];

// ─── Voice Pairs ──────────────────────────────────────────────────────
// "Don't write this / write this instead" examples in the brand voice.

export const VOICE_PAIRS = [
  {
    bad: "[A cold, corporate, or over-apologetic line the brand wants to avoid.]",
    good: "[The same message rewritten in the brand's preferred voice.]",
  },
  {
    bad: "[Another phrase to avoid.]",
    good: "[The on-brand rewrite.]",
  },
  {
    bad: "[Another phrase to avoid.]",
    good: "[The on-brand rewrite.]",
  },
];

// ─── Products ─────────────────────────────────────────────────────────
// Short product summaries shown in the Playbook.

export const PRODUCTS = [
  {
    name: "[Product 1 name]",
    tagline: "[Short tagline]",
    price: "[Price, e.g. $XX / unit]",
    description: "[What it is, how to use it, key claims.]",
    ingredients: "[Key ingredients / components.]",
    certifications: ["[Cert 1]", "[Cert 2]"],
  },
  {
    name: "[Product 2 name]",
    tagline: "[Short tagline]",
    price: "[Price]",
    description: "[What it is, how to use it, key claims.]",
    ingredients: "[Key ingredients / components.]",
    certifications: ["[Cert 1]"],
  },
  {
    name: "[Subscription / bundle name, if any]",
    tagline: "[Short tagline]",
    price: "[Price / month]",
    description: "[How the subscription or bundle works — cadence, savings, swap/skip/cancel rules.]",
    ingredients: "[Varies / N/A]",
    certifications: ["[Cert 1]"],
  },
];

// ─── Product Cards ────────────────────────────────────────────────────
// Full detail cards. Each card: { key, name, tagline, stats[], sections[] }.
// stats: small headline figures. sections: { heading, items[] } — items
// support **bold** markdown.

export const PRODUCT_CARDS = [
  {
    key: "product-1",
    name: "[Product 1 name]",
    tagline: "[One-line description]",
    stats: [
      { value: "[e.g. 50ml]", label: "[Size]" },
      { value: "[e.g. $XX]", label: "[Price]" },
      { value: "[e.g. 15%]", label: "[Sub saving]" },
      { value: "[e.g. 2–3]", label: "[Per use]" },
    ],
    sections: [
      {
        heading: "What it does",
        items: [
          "[Benefit 1]",
          "[Benefit 2]",
          "[Benefit 3]",
        ],
      },
      {
        heading: "Key ingredients",
        items: [
          "**[Ingredient]** — [what it does]",
          "**[Ingredient]** — [what it does]",
        ],
      },
      {
        heading: "How to use",
        items: [
          "[Step 1]",
          "[Step 2]",
        ],
      },
      {
        heading: "What agents need to know",
        items: [
          "[Most common customer question + the answer]",
          "[Common misunderstanding + how to handle it]",
        ],
      },
    ],
  },
  {
    key: "product-2",
    name: "[Product 2 name]",
    tagline: "[One-line description]",
    stats: [
      { value: "[size]", label: "[Size]" },
      { value: "[price]", label: "[Price]" },
    ],
    sections: [
      {
        heading: "What it does",
        items: ["[Benefit 1]", "[Benefit 2]"],
      },
      {
        heading: "How to use",
        items: ["[Step 1]", "[Step 2]"],
      },
    ],
  },
];

// ─── About the Brand Q&A ──────────────────────────────────────────────
// Brand-level FAQ. chips group questions in the Playbook UI.

export const ABOUT_BRAND_QA = [
  {
    q: "[Brand question — e.g. Where is [BRAND_NAME] based?]",
    a: "[Answer.]",
    chips: ["Brand"],
  },
  {
    q: "[Brand question — e.g. Is [BRAND_NAME] vegan / cruelty-free / etc.?]",
    a: "[Answer.]",
    chips: ["Brand", "Product"],
  },
];

// ─── Common Product Q&A ───────────────────────────────────────────────

export const COMMON_PRODUCT_QA = [
  {
    q: "[Common product question 1]",
    a: "[Answer.]",
    chips: ["Product", "How to use"],
  },
  {
    q: "[Common product question 2]",
    a: "[Answer.]",
    chips: ["Product"],
  },
  {
    q: "[Common product question 3 — e.g. When will I see results?]",
    a: "[Answer.]",
    chips: ["Product", "Results"],
  },
];

export const PRODUCT_QA_CHIPS = ["Product", "Brand", "How to use", "Results", "Safety"];

// ─── Policy Q&A ───────────────────────────────────────────────────────

export const POLICY_QA = [
  {
    q: "[What is the refund policy?]",
    a: "[Refund policy answer — windows, eligibility, exceptions.]",
    chips: ["Refunds"],
  },
  {
    q: "[How long does shipping take?]",
    a: "[Shipping answer per region.]",
    chips: ["Shipping"],
  },
  {
    q: "[How do I pause or cancel my subscription?]",
    a: "[Subscription management answer.]",
    chips: ["Subscriptions"],
  },
  {
    q: "[What if my order arrives damaged?]",
    a: "[Damaged-order answer.]",
    chips: ["Damaged", "Replacements"],
  },
];

export const POLICY_QA_CHIPS = ["Refunds", "Shipping", "Subscriptions", "Damaged", "Replacements", "Billing", "Safety"];

// ─── Shipping ─────────────────────────────────────────────────────────

export const SHIPPING_ROWS = [
  { region: "[Region 1, e.g. Domestic]", standard: "[3–5 business days]", express: "[1–2 business days]", notes: "[Free shipping threshold, etc.]" },
  { region: "[Region 2]",                standard: "[7–12 business days]", express: "[3–5 business days]", notes: "[Notes]" },
  { region: "[Region 3]",                standard: "[8–14 business days]", express: "[5–7 business days]", notes: "[Duties may apply, etc.]" },
];

// ─── Escalation ───────────────────────────────────────────────────────

export const ESCALATION = [
  {
    trigger: "[Escalation trigger — e.g. Severe safety report]",
    owner: "[Owner role / name]",
    channel: "[e.g. Slack #cx-escalations]",
    sla: "[Immediately / Within 1 hour]",
  },
  {
    trigger: "[Escalation trigger — e.g. Refund outside standard policy]",
    owner: "[Owner role / name]",
    channel: "[Channel]",
    sla: "[SLA]",
  },
  {
    trigger: "[Escalation trigger — e.g. Legal threat or regulatory inquiry]",
    owner: "[Owner role / name]",
    channel: "[Channel]",
    sla: "Immediately",
  },
];

// ─── Subtabs ──────────────────────────────────────────────────────────

export const PLAYBOOK_SUBTABS_NEW = [
  "Products",
  "How To",
  "Policy",
  "Tone of Voice",
  "Escalation",
  "Non-Negotiables",
];
