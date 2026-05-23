// LUMÉ CX Playbook — haircare brand demo content.

// ─── Non-Negotiables ──────────────────────────────────────────────────

export const NON_NEGOTIABLES = [
  {
    title: "Never minimise an adverse reaction",
    detail: "Any report of rash, hives, swelling, eye irritation, or severe scalp reaction = immediate concern. Stop use, issue full refund, escalate to Manager within 1 hour. Safety first, always.",
    severity: "high",
  },
  {
    title: "Never give medical advice",
    detail: "Share product information only. For pregnancy, medication interactions, or health conditions — always defer to their doctor. No exceptions.",
    severity: "high",
  },
  {
    title: "Never promise a refund before checking the order",
    detail: "Always pull the order status before committing. Check open/unopened status and purchase date. Opened product = exchange or store credit (unless adverse reaction).",
    severity: "high",
  },
  {
    title: "Photo required for damaged or quality issues",
    detail: "We need to see it before we action it. 'Can you send a quick photo so I can get this sorted?' Once confirmed: replacement dispatched, no return needed.",
    severity: "high",
  },
  {
    title: "Understand the reason before offering a save play",
    detail: "For cancellations — ask why before offering anything. Wrong serums = swap offer. Too expensive = pause or discount. Not using fast enough = skip a month. Match the save to the real problem.",
    severity: "med",
  },
];

// ─── Voice Pairs ──────────────────────────────────────────────────────

export const VOICE_PAIRS = [
  {
    bad: "Unfortunately, we are unable to process your refund as the product has been opened.",
    good: "Since the serum has been opened, we can't do a cash refund — but I'd love to get you an exchange or store credit so you can try a formula that's a better fit for your hair.",
  },
  {
    bad: "We apologise for any inconvenience. Please allow 3–5 business days for your replacement.",
    good: "Your replacement is on its way — you'll get a tracking email shortly. Let me know if there's anything else I can help with.",
  },
  {
    bad: "Please be advised that the tingling sensation is a known characteristic of this product.",
    good: "That tingling is actually the peppermint oil getting to work — it's completely normal and a good sign. If it ever feels uncomfortable rather than just tingly, rinse with cool water and do a patch test before your next use.",
  },
  {
    bad: "Unfortunately the swap window has closed for this month's shipment.",
    good: "The cutoff for this month was the 12th, so we've just missed it for this box — but I've made a note of the swap you want and I'll make sure it's updated for next month.",
  },
];

// ─── Products ─────────────────────────────────────────────────────────

export const PRODUCTS = [
  {
    name: "Smooth Serum",
    tagline: "Frizz control & heat protection",
    price: "$79 AUD / $52 USD",
    description: "Frizz control, humidity shield, heat protection up to 230°C. Apply to damp or dry hair. 2–3 pumps from mid-lengths to ends.",
    ingredients: "Argan oil, silk proteins, keratin complex.",
    certifications: ["Vegan", "Cruelty-Free", "Colour-Safe"],
  },
  {
    name: "Repair Serum",
    tagline: "Bond repair for damaged hair",
    price: "$85 AUD / $56 USD",
    description: "Bond repair for damaged, colour-treated, or chemically processed hair. Apply to damp hair before styling. 3–4 pumps, focus on ends.",
    ingredients: "Bond builders, hydrolysed keratin, vitamin E.",
    certifications: ["Vegan", "Cruelty-Free", "Colour-Safe"],
  },
  {
    name: "Scalp Serum",
    tagline: "Growth stimulation & scalp health",
    price: "$89 AUD / $59 USD",
    description: "Growth stimulation and scalp health. Addresses dandruff, oiliness, thinning. Apply directly to scalp, massage in. Do not rinse. Use 3x per week.",
    ingredients: "Caffeine, niacinamide, salicylic acid, peppermint oil.",
    certifications: ["Vegan", "Cruelty-Free"],
  },
  {
    name: "Glow Serum",
    tagline: "Shine, softness & split end treatment",
    price: "$75 AUD / $49 USD",
    description: "Shine, softness, split end treatment. Lightweight daily serum. Apply to dry or damp hair. 1–2 pumps, all over. Best for fine hair.",
    ingredients: "Camellia oil, vitamin C ester, bamboo extract.",
    certifications: ["Vegan", "Cruelty-Free", "Colour-Safe"],
  },
  {
    name: "The Hair Edit (Subscription Box)",
    tagline: "Monthly curated serum box",
    price: "$89 AUD / $59 USD/month",
    description: "Monthly curated box of 2 serums based on hair profile quiz. Ships on the 15th. Subscribers save 15% vs single purchase. Pause, skip, or cancel anytime.",
    ingredients: "Varies by box contents.",
    certifications: ["Vegan", "Cruelty-Free"],
  },
];

export const PRODUCT_CARDS = [
  {
    key: "smooth",
    name: "Smooth Serum",
    tagline: "Frizz control, humidity shield & heat protection up to 230°C",
    stats: [
      { value: "50ml", label: "Volume" },
      { value: "$79 AUD", label: "Single" },
      { value: "15%", label: "Sub saving" },
      { value: "2–3 pumps", label: "Per use" },
    ],
    sections: [
      {
        heading: "What it does",
        items: [
          "Tames frizz and flyaways in all humidity levels",
          "Provides heat protection up to 230°C — safe for straighteners and blow dryers",
          "Leaves hair smooth and touchable, not heavy or greasy",
          "Works on damp **or** dry hair — versatile enough for touch-ups between washes",
        ],
      },
      {
        heading: "Key ingredients",
        items: [
          "**Argan oil** — nourishes and seals the cuticle",
          "**Silk proteins** — adds slip, reduces breakage",
          "**Keratin complex** — smooths the hair shaft to lock out humidity",
        ],
      },
      {
        heading: "How to use",
        items: [
          "Apply 2–3 pumps to palms, distribute through mid-lengths to ends",
          "Use on damp hair before heat styling, or on dry hair to tame flyaways",
          "Do not apply directly to roots (weighs fine hair down)",
          "Safe to use daily",
        ],
      },
      {
        heading: "What agents need to know",
        items: [
          "Most common customer question: \"Will it work in high humidity?\" → Yes — the humidity shield is the core claim",
          "Colour-safe ✓ — use for any colour-treated customer",
          "If customer says it feels heavy: they're using too much, or applying to roots. Reduce to 1–2 pumps and avoid roots",
          "NOT for scalp conditions — that's Scalp Serum's job",
        ],
      },
    ],
  },
  {
    key: "repair",
    name: "Repair Serum",
    tagline: "Bond repair for damaged, colour-treated and chemically processed hair",
    stats: [
      { value: "50ml", label: "Volume" },
      { value: "$85 AUD", label: "Single" },
      { value: "15%", label: "Sub saving" },
      { value: "3–4 pumps", label: "Per use" },
    ],
    sections: [
      {
        heading: "What it does",
        items: [
          "Rebuilds broken disulfide bonds caused by bleach, colour, and chemical processing",
          "Reduces breakage, improves elasticity, and restores strength over time",
          "Noticeably softer, stronger hair after 3–4 weeks of consistent use",
          "Best for: bleached, highlighted, relaxed, or heat-damaged hair",
        ],
      },
      {
        heading: "Key ingredients",
        items: [
          "**Bond builders** — reconnect broken bonds in the hair shaft cortex",
          "**Hydrolysed keratin** — penetrates the hair structure to rebuild from within",
          "**Vitamin E** — antioxidant protection against ongoing heat and environmental damage",
        ],
      },
      {
        heading: "How to use",
        items: [
          "Apply 3–4 pumps to damp hair before styling",
          "Focus on ends and the most damaged sections",
          "Leave in — do not rinse",
          "Use consistently for 6+ weeks to see full bond-repair results",
        ],
      },
      {
        heading: "What agents need to know",
        items: [
          "Most common question: \"When will I see results?\" → Visible improvement typically starts at 3–4 weeks. Maximum bond repair at 6–8 weeks",
          "If customer is disappointed at 2 weeks: totally normal — set the expectation and encourage them to keep going",
          "Colour-safe ✓ — in fact, this is the **recommended serum** for any colour-treated customer",
          "If customer has both colour damage AND scalp concerns: Repair + Scalp is the ideal combo (both can be in the Hair Edit box)",
        ],
      },
    ],
  },
  {
    key: "scalp",
    name: "Scalp Serum",
    tagline: "Growth stimulation, scalp health & dandruff relief",
    stats: [
      { value: "30ml", label: "Volume" },
      { value: "$89 AUD", label: "Single" },
      { value: "3×/week", label: "Usage" },
      { value: "Peppermint", label: "Key note" },
    ],
    sections: [
      {
        heading: "What it does",
        items: [
          "Stimulates the scalp to support healthy hair growth cycles",
          "Reduces excess sebum (oiliness), flakiness, and dandruff",
          "Addresses thinning at the roots over 8–12 weeks",
          "Not a daily serum — designed for 3× per week scalp treatment",
        ],
      },
      {
        heading: "Key ingredients",
        items: [
          "**Caffeine** — stimulates follicles and increases blood flow to the scalp",
          "**Niacinamide** — strengthens the scalp barrier, reduces inflammation",
          "**Salicylic acid** — exfoliates the scalp, clears blocked follicles",
          "**Peppermint oil** — creates the characteristic cooling/tingling sensation, improves circulation",
        ],
      },
      {
        heading: "How to use",
        items: [
          "Apply directly to the scalp — part hair and use the dropper to apply in sections",
          "Massage in with fingertips for 1–2 minutes",
          "**Do NOT rinse out** — leave-in treatment",
          "Use 3× per week, not daily (over-use can cause irritation)",
          "Best applied to clean, dry or slightly damp scalp after washing",
        ],
      },
      {
        heading: "⚠️ Tingling — what agents MUST know",
        items: [
          "**The tingling is expected and normal** — caused by peppermint oil improving circulation",
          "First-time users often report alarm — reassure them: 'That cooling tingle is the peppermint oil working — it means good things are happening'",
          "**Tingling ≠ adverse reaction** — but burning, redness, or pain IS a concern",
          "If customer reports pain (not tingle): stop use, patch test on inner wrist, escalate to Manager if reaction persists",
          "Most common complaint: 'It burns' → ask them to describe — is it a cooling tingle or actual burning/stinging? Cooling/tingle = reassure. Burning/pain = stop use immediately",
        ],
      },
    ],
  },
  {
    key: "glow",
    name: "Glow Serum",
    tagline: "Daily shine, softness & split end treatment for all hair types",
    stats: [
      { value: "50ml", label: "Volume" },
      { value: "$75 AUD", label: "Single" },
      { value: "15%", label: "Sub saving" },
      { value: "1–2 pumps", label: "Per use" },
    ],
    sections: [
      {
        heading: "What it does",
        items: [
          "Adds mirror shine and softness without weight",
          "Treats and prevents split ends with daily use",
          "Lightweight formula — designed for fine or normal hair",
          "Can be layered with Smooth or Repair without feeling heavy",
        ],
      },
      {
        heading: "Key ingredients",
        items: [
          "**Camellia oil** — ultra-light conditioning oil, absorbs instantly without grease",
          "**Vitamin C ester** — brightens natural colour tone, antioxidant protection",
          "**Bamboo extract** — adds silky texture and strengthens against breakage",
        ],
      },
      {
        heading: "How to use",
        items: [
          "Apply 1–2 pumps to dry or damp hair",
          "Work through all over — roots to ends — for an all-over glow",
          "Or focus on ends only for a split-end treatment approach",
          "Safe for daily use — the lightest serum in the range",
        ],
      },
      {
        heading: "What agents need to know",
        items: [
          "Most popular serum for fine hair — reassure customers that lightweight really means lightweight",
          "Often paired with Smooth (Smooth for frizz protection + Glow for daily shine top-up)",
          "Colour-safe ✓",
          "If customer finds Smooth too heavy: suggest switching to Glow as their daily serum and keeping Smooth only for heat styling days",
        ],
      },
    ],
  },
  {
    key: "hair-edit",
    name: "The Hair Edit",
    tagline: "Monthly curated serum box — 2 serums matched to your hair profile",
    stats: [
      { value: "$89 AUD", label: "Per month" },
      { value: "2 serums", label: "Per box" },
      { value: "15th", label: "Ships monthly" },
      { value: "15%", label: "Vs single" },
    ],
    sections: [
      {
        heading: "How it works",
        items: [
          "Customers complete a hair profile quiz at sign-up — 4–5 questions about hair type, concerns, and goals",
          "Each month they receive 2 serums matched to their profile",
          "Customers can swap which serums they receive at any time via their Skio dashboard",
          "Ships on the **15th of each month** — swap/skip cutoff is the **12th**",
        ],
      },
      {
        heading: "Subscription management (Skio)",
        items: [
          "**Pause**: up to 2 months — keeps pricing locked, no payment taken",
          "**Skip**: skip 1 upcoming shipment without pausing",
          "**Swap serums**: change which 2 serums come in the next box",
          "**Cancel**: always offer a pause or skip first — only cancel if they still want to",
          "Agents can make all changes directly in Skio — customers don't need to self-serve",
        ],
      },
      {
        heading: "Save plays by cancel reason",
        items: [
          "**Too expensive** → Pause for 2 months + loyalty discount code for return",
          "**Wrong serums** → Swap immediately in Skio — \"I can update that right now\"",
          "**Too much product** → Skip next month or switch to bi-monthly shipping",
          "**No results** → Timeline education — check how long they've been using and application method",
          "**Moving / personal change** → Pause offer. If declined, warm sendoff with no pushback",
        ],
      },
      {
        heading: "What agents need to know",
        items: [
          "Subscribers save 15% vs buying serums individually — always mention this value anchor",
          "The quiz result can be re-done — if customer feels they got the wrong serums, update their profile",
          "Failed payments: Skio retries automatically — check status before telling the customer",
          "If unsure which serums suit a customer's hair type, refer to the Products tab for quick guidance",
        ],
      },
    ],
  },
];

export const ABOUT_IM8_QA = [
  {
    q: "Are LUMÉ products vegan and cruelty-free?",
    a: "Yes — all LUMÉ products are 100% vegan and cruelty-free. We never test on animals and no animal-derived ingredients are used.",
    chips: ["Brand"],
  },
  {
    q: "Where is LUMÉ based?",
    a: "LUMÉ is based in Sydney, NSW, Australia. We ship to AU, US, and UK.",
    chips: ["Brand"],
  },
  {
    q: "Are LUMÉ serums safe for colour-treated hair?",
    a: "All LUMÉ serums are colour-safe. The Repair Serum is especially beneficial for colour-treated hair as it helps rebuild bonds damaged during the colouring process.",
    chips: ["Brand", "Product"],
  },
];

export const COMMON_PRODUCT_QA = [
  {
    q: "Can I use two serums at the same time?",
    a: "Yes — many customers layer. Apply Scalp Serum to scalp first, let it absorb for 2 minutes, then apply your hair serum (Smooth, Repair, or Glow) to mid-lengths and ends.",
    chips: ["Product", "How to use"],
  },
  {
    q: "How long does one bottle last?",
    a: "Smooth, Repair, and Glow Serums last approximately 2–3 months with daily use. Scalp Serum (used 3x per week) lasts approximately 3–4 months.",
    chips: ["Product"],
  },
  {
    q: "Can I use LUMÉ serums if I'm pregnant?",
    a: "We recommend checking with your doctor before using any new hair care products during pregnancy, particularly the Scalp Serum which contains salicylic acid.",
    chips: ["Product", "Safety"],
  },
  {
    q: "Why is my Scalp Serum tingling?",
    a: "That tingling is the peppermint oil getting to work — it's completely normal and a sign the formula is activating. If it ever feels uncomfortable rather than tingly, rinse with cool water and do a patch test on your inner wrist before reapplying.",
    chips: ["Product", "Scalp Serum"],
  },
  {
    q: "When will I see results?",
    a: "Smooth Serum: smoothing from first use, full results at 4 weeks. Repair Serum: reduced breakage from week 2, strength at 6 weeks. Scalp Serum: scalp feel improves week 1, growth results at 8–12 weeks. Glow Serum: immediate shine, split end improvement at 3–4 weeks.",
    chips: ["Product", "Results"],
  },
  {
    q: "How do I apply each serum?",
    a: "Smooth: damp or dry hair, 2–3 pumps, mid-lengths to ends. Repair: damp hair only, 3–4 pumps, focus on ends. Scalp: dry scalp, directly on scalp, massage in, do not rinse, 3x/week. Glow: damp or dry, 1–2 pumps, all over.",
    chips: ["Product", "How to use"],
  },
];

export const PRODUCT_QA_CHIPS = ["Product", "Brand", "How to use", "Results", "Safety", "Scalp Serum"];

// ─── Policy Q&A ───────────────────────────────────────────────────────

export const POLICY_QA = [
  {
    q: "What is the refund policy?",
    a: "Unopened products: full refund within 30 days of purchase. Opened products: exchange or store credit only (unless you've had an adverse reaction — in that case, full refund regardless). Beyond 30 days: store credit only, Manager approval required for exceptions.",
    chips: ["Refunds"],
  },
  {
    q: "What if I've had an adverse reaction?",
    a: "Full refund, no questions asked. Please stop using the product immediately. If severe (swelling, difficulty breathing), seek medical attention. We'll also log it internally for our quality team.",
    chips: ["Refunds", "Safety"],
  },
  {
    q: "How long does shipping take?",
    a: "Australia: 3–5 business days. US: 7–12 business days. UK: 8–14 business days. Express options available at checkout.",
    chips: ["Shipping"],
  },
  {
    q: "How do I pause or cancel my subscription?",
    a: "Log into your customer portal via the link in any of our emails → Manage Subscription → Pause (1, 2, or 3 months) or Cancel. You can also contact us directly and we'll handle it for you.",
    chips: ["Subscriptions"],
  },
  {
    q: "How do I swap serums in my Hair Edit box?",
    a: "Log into your portal and update your hair profile, or contact us directly. Swap requests must be received by the 12th of the month — 3 days before shipping on the 15th.",
    chips: ["Subscriptions"],
  },
  {
    q: "What if my order arrives damaged?",
    a: "Send us a photo of the damage and we'll send a replacement straight away — no return needed.",
    chips: ["Damaged", "Replacements"],
  },
  {
    q: "My discount code isn't working — what do I do?",
    a: "Check if the code has expired or if there's a minimum spend. One use per customer. If you think there's a technical issue, contact us and we can apply the discount manually via a draft order.",
    chips: ["Billing"],
  },
];

export const POLICY_QA_CHIPS = ["Refunds", "Shipping", "Subscriptions", "Damaged", "Replacements", "Billing", "Safety"];

// ─── Shipping ─────────────────────────────────────────────────────────

export const SHIPPING_ROWS = [
  { region: "Australia",      standard: "3–5 business days",   express: "1–2 business days",  notes: "Free standard shipping on orders over $100 AUD" },
  { region: "United States",  standard: "7–12 business days",  express: "3–5 business days",  notes: "Free standard shipping on orders over $75 USD" },
  { region: "United Kingdom", standard: "8–14 business days",  express: "5–7 business days",  notes: "Duties may apply" },
];

// ─── Escalation ───────────────────────────────────────────────────────

export const ESCALATION = [
  {
    trigger: "Adverse reaction — severe (swelling, hives, difficulty breathing)",
    owner: "Maya Chen — CX Manager",
    channel: "Slack #cx-escalations",
    sla: "Immediately",
  },
  {
    trigger: "Adverse reaction — mild, logged for quality review",
    owner: "Maya Chen — CX Manager",
    channel: "Slack #cx-escalations",
    sla: "Within 1 hour",
  },
  {
    trigger: "Refund request outside standard policy (30 days / opened product)",
    owner: "Maya Chen — CX Manager",
    channel: "Slack #cx-ops",
    sla: "Within 2 hours",
  },
  {
    trigger: "Legal threat or regulatory inquiry",
    owner: "Management",
    channel: "Slack #legal",
    sla: "Immediately",
  },
  {
    trigger: "VIP, influencer, or affiliate complaint",
    owner: "Jordan Park — Senior CX Specialist",
    channel: "Slack #cx-vip",
    sla: "Within 1 hour",
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
