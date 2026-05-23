// Luma CX Playbook — placeholder content for demo deployment.
// Replace each section with the client's actual SOPs, policies, and product data.

// ─── Non-Negotiables ──────────────────────────────────────────────────
// [Client SOPs go here] — the hard rules your team never breaks.

export const NON_NEGOTIABLES = [
  {
    title: "Never give medical advice",
    detail: "Always defer to the customer's doctor or specialist. Share product information only — that's it.",
    severity: "high",
  },
  {
    title: "Never promise a refund before checking the order",
    detail: "Always pull the order and subscription status before committing. A wrongly promised refund creates a worse problem than a delayed one.",
    severity: "high",
  },
  {
    title: "Photo required for damaged or quality issues",
    detail: "We need to see the issue before we can action it. 'Send a photo so we can sort this for you' is the standard ask. Once confirmed: free replacement, no return needed.",
    severity: "high",
  },
  {
    title: "Escalate before going outside policy",
    detail: "If a customer is asking for something outside standard policy, check with your manager before committing. A held ticket is better than a wrong commitment.",
    severity: "high",
  },
  {
    title: "No phone support — email and chat only",
    detail: "Our support is via email and chat — we will make sure you get the same level of care right here.",
    severity: "med",
  },
];

// ─── Voice Pairs ──────────────────────────────────────────────────────
// [Brand voice guide goes here] — example bad → good rewrites.

export const VOICE_PAIRS = [
  {
    bad: "Unfortunately, we are unable to process your refund as it falls outside our policy window.",
    good: "Your order is outside the return window, so a refund isn't possible — but here's what we can do. Let me know what works best for you.",
  },
  {
    bad: "I apologise for the inconvenience. Your concern has been escalated.",
    good: "I want to make sure this gets to the right person — I'm looping in our team. You'll hear back within 24 hours with next steps.",
  },
  {
    bad: "Per our records, you have already received a refund for this order.",
    good: "Looking at your account, the refund was processed — it should be back within 5–7 business days. Let me know if you don't see it.",
  },
  {
    bad: "Thank you for contacting our Customer Success team. We will look into this and get back to you.",
    good: "Got it — I can see exactly what happened. Let me sort this for you now.",
  },
];

// ─── Products ─────────────────────────────────────────────────────────
// [Product catalogue goes here]

export const PRODUCTS = [
  {
    name: "[Client Product A]",
    tagline: "Flagship product",
    price: "$XX OTP | $XX/month subscription",
    description: "[Product description goes here]",
    ingredients: "[Ingredient list goes here]",
    certifications: [],
  },
  {
    name: "[Client Product B]",
    tagline: "Supporting product",
    price: "$XX OTP | $XX/month subscription",
    description: "[Product description goes here]",
    ingredients: "[Ingredient list goes here]",
    certifications: [],
  },
];

export const PRODUCT_CARDS = [];

export const ABOUT_IM8_QA = [
  {
    q: "[About the brand — Q&A goes here]",
    a: "[Answer goes here]",
    chips: ["Brand"],
  },
];

export const COMMON_PRODUCT_QA = [
  {
    q: "[Common product question goes here]",
    a: "[Answer goes here]",
    chips: ["Product"],
  },
];

export const PRODUCT_QA_CHIPS = ["Product", "Brand", "Ingredients", "Dosage"];

// ─── Policy Q&A ───────────────────────────────────────────────────────
// [Client policies go here]

export const POLICY_QA = [
  {
    q: "What is the return/refund policy?",
    a: "[Client refund policy goes here — e.g. 30-day money-back guarantee details]",
    chips: ["Refunds"],
  },
  {
    q: "How long does shipping take?",
    a: "[Client shipping lead times go here by region]",
    chips: ["Shipping"],
  },
  {
    q: "How do I cancel my subscription?",
    a: "[Client cancellation process goes here]",
    chips: ["Subscriptions"],
  },
  {
    q: "What happens if my order arrives damaged?",
    a: "Send us a photo of the damage and we'll send a replacement straight away — no return needed.",
    chips: ["Damaged", "Replacements"],
  },
];

export const POLICY_QA_CHIPS = ["Refunds", "Shipping", "Subscriptions", "Damaged", "Replacements", "Billing"];

// ─── Shipping ─────────────────────────────────────────────────────────
// [Client shipping data goes here]

export const SHIPPING_ROWS = [
  { region: "Domestic",          standard: "3–5 business days",  express: "1–2 business days",  notes: "" },
  { region: "International",     standard: "7–14 business days", express: "3–5 business days",  notes: "Duties may apply" },
];

// ─── Escalation ───────────────────────────────────────────────────────
// [Client escalation tree goes here]

export const ESCALATION = [
  {
    trigger: "Customer reports a health or safety concern",
    owner: "[Health/Compliance Owner]",
    channel: "Slack #escalations",
    sla: "Immediately",
  },
  {
    trigger: "Legal threat or regulatory inquiry",
    owner: "[Legal Contact]",
    channel: "Slack #legal-escalations",
    sla: "Immediately",
  },
  {
    trigger: "Refund request outside standard policy",
    owner: "[CX Manager]",
    channel: "Slack #cx-ops",
    sla: "Within 2 hours",
  },
  {
    trigger: "VIP or high-value customer issue",
    owner: "[Account Owner / Manager]",
    channel: "Slack #cx-vip",
    sla: "Within 1 hour",
  },
];

// ─── Subtabs ──────────────────────────────────────────────────────────

export const PLAYBOOK_SUBTABS_NEW = [
  "Products",
  "Policy",
  "Shipping",
  "Escalation",
  "Voice",
  "Non-Negotiables",
];
