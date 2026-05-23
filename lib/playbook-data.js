// Static reference data for the Playbook tab.
//
// May 2026 redesign — Products is the new default subtab, with richer
// product detail cards + a "Common Questions" section organised by
// chip-filterable categories. The older flat exports (NON_NEGOTIABLES,
// VOICE_PAIRS, PRODUCTS, SHIPPING_ROWS, ESCALATION) are preserved for
// backwards compatibility with code that imports them (notably
// lib/ask-im8-knowledge.js, which builds the bot system prompt from
// NON_NEGOTIABLES), with content sharpened to match the preview.

// ─── Non-Negotiables ─────────────────────────────────────────────────
// The hard rules we never break. Imported by ask-im8-knowledge.js into
// the bot's system prompt, so wording stays operational not aspirational.

export const NON_NEGOTIABLES = [
  {
    title: "Never play doctor",
    detail: "We never advise on medication interactions, pregnancy, breastfeeding, or specific medical conditions. Always defer to the customer's GP / midwife / specialist. Share the ingredient panel — that's it.",
    severity: "high",
  },
  {
    title: "Never confirm or deny other customers' adverse reports",
    detail: 'Even if a customer says "I heard someone else got a rash." The answer is: "We can\'t speak to other customers\' cases — but if anything similar is happening for you, we\'d recommend checking in with your doctor."',
    severity: "high",
  },
  {
    title: 'Never use "wishing you a speedy recovery" phrasing',
    detail: "Implies causation — that IM8 caused the symptom. Stay warm but don't connect cause and effect in writing.",
    severity: "high",
  },
  {
    title: "Never fabricate ingredient amounts",
    detail: "If it's on im8health.com/pages/ingredients, you can share it. If it's not, say so and point them to the page. Don't invent, don't estimate, don't hint.",
    severity: "high",
  },
  {
    title: "Never promise a refund before checking the order",
    detail: "Always pull the order and subscription status in Shopify/Skio before committing. A wrongly promised refund creates a worse problem than a delayed one.",
    severity: "high",
  },
  {
    title: "Photo REQUIRED for damaged or quality issues",
    detail: "We need to see the issue before we can action it. \"Send a photo so we can sort this for you\" is the standard ask — not \"if possible.\" Once we have it: free replacement, no return needed, batch number logged for QC.",
    severity: "high",
  },
  {
    title: "NSF Sport: PRO only — Longevity is PENDING",
    detail: 'Essentials PRO is NSF Certified for Sport (every batch tested for 280+ banned substances). Longevity is PENDING — never confirm as certified. If asked: "Longevity\'s NSF certification is in progress — Essentials PRO is currently the certified one."',
    severity: "med",
  },
  {
    title: "No phone calls — ever",
    detail: 'One sentence answer: "Our support is via email and chat — we\'ll make sure you get the same level of care right here." Don\'t apologise twice. Don\'t explain why.',
    severity: "med",
  },
  {
    title: "Trustpilot link only on 100% positive messages",
    detail: "Include the Trustpilot link ONLY when the customer's message is entirely positive with zero negatives. Any mention of taste, price, delay, packaging — no link.",
    severity: "med",
  },
];

// ─── Voice Pairs ─────────────────────────────────────────────────────
// Bad → Good rewrites. Used to teach the IM8 voice by contrast.

export const VOICE_PAIRS = [
  {
    bad: "Unfortunately, we are unable to process your refund as it falls outside our policy window.",
    good: "Your order is outside the 30-day window, so a refund isn't possible — but here's what we *can* do: pause your next renewal, swap your flavour, or extend your delivery date. Just let me know which feels right.",
  },
  {
    bad: "I apologise for the inconvenience. Your concern has been escalated and we will get back to you shortly.",
    good: "I want to make sure this gets to the right person — I'm looping in our Head of CX. You'll hear back from us within 24 hours with next steps.",
  },
  {
    bad: "Per our records, you have already received a refund for this order.",
    good: "Looking at your account, the refund was processed on the 3rd — it should be back in your account within 5-7 business days. Let me know if you don't see it.",
  },
  {
    bad: "You will need to log in to your account to update your shipping address.",
    good: "You can update your address right from your account — just head here and follow these two steps. Let me know if anything's unclear.",
  },
  {
    bad: "I apologise for any inconvenience this delay may have caused.",
    good: "Thanks for your patience — I've checked your order and here's exactly what's happening.",
  },
];

// ─── Legacy PRODUCTS export ──────────────────────────────────────────
// Kept for backwards compatibility with the older PlaybookProducts
// subcomponent (now orphaned). USD pricing stripped — agents must
// pull from Shopify/Gorgias since customers see local currency.
// New design uses PRODUCT_CARDS below.

export const PRODUCTS = [
  {
    name: "Daily Ultimate Essentials PRO",
    tag: "The all-in-one daily foundation",
    specs: [
      ["Format", "Stick packs · 30/box · NSF Certified for Sport"],
      ["Serving size", "13.6g · 20 cal"],
      ["Ingredients", "90 precisely optimised"],
      ["Key highlights", "CoQ10 100mg, MSM 1,500mg, Saffron 30mg, probiotics 10B CFU, CRT8 complex"],
      ["Flavors", "Acai+Berry · Mango+Passionfruit · Lemon+Orange · Variety Pack"],
    ],
    pricing: [
      ["Pricing", "Varies by region — pull from Shopify/Gorgias before quoting"],
    ],
  },
  {
    name: "Daily Ultimate Longevity",
    tag: "Targets the 12 hallmarks of aging",
    specs: [
      ["Format", "Sachets · 30/box · Açaí + Pomegranate · NSF Sport PENDING"],
      ["5 Complexes", "Cellular Foundation Builder · Cellular Protection Activator · NMN NAD+ Energy Booster · Metabolic AMPK/SIRT1 Activator · Cellular Renewal Activator"],
      ["Key amounts", "NMN 300mg · Glycine 3g · Taurine 2g · Trans-Resveratrol 250mg · Quercetin 250mg · Fisetin 100mg"],
      ["Heads up", "Contains Stevia Leaf Extract. Capsule format discontinued — current product is sachet only."],
    ],
    pricing: [
      ["Pricing", "Varies by region — pull from Shopify/Gorgias before quoting"],
    ],
  },
  {
    name: "The Beckham Stack",
    tag: "Essentials PRO + Longevity bundled",
    specs: [
      ["Contents", "One box Essentials PRO + one box Longevity"],
      ["Best for", "Customers who want the full daily protocol"],
    ],
    pricing: [
      ["Pricing", "Bundle discount applied — exact amount varies by region"],
    ],
  },
];

// ─── Shipping rows (legacy) ──────────────────────────────────────────
// New design pulls from SHIPPING_LEAD_TIMES in ask-im8-knowledge.js,
// but this export stays for the orphaned old subcomponent.

export const SHIPPING_ROWS = [
  // North America
  { region: "United States", sla: "~6 days", note: "Offer 6-pack comp on active subs if delay >4–6 days" },
  { region: "Canada", sla: "~16 days", note: "Long lead time — set expectations early" },
  // UK & Ireland
  { region: "United Kingdom", sla: "~7 days", note: "" },
  { region: "Ireland", sla: "7–9 business days", note: "EU — quoted with EU lead time" },
  { region: "Isle of Man", sla: "~6 days", note: "" },
  // Europe — EU UPDATE (Cherie, May 22 2026): all EU member states are
  // now quoted to customers AND internally as 7–9 business days. Per-
  // country granular SLAs retired. Non-EU European countries
  // (Switzerland, Norway) keep their existing lead times because they
  // ship via different routes.
  { region: "Germany", sla: "7–9 business days", note: "" },
  { region: "France", sla: "7–9 business days", note: "" },
  { region: "Italy", sla: "7–9 business days", note: "" },
  { region: "Spain", sla: "7–9 business days", note: "" },
  { region: "Netherlands", sla: "7–9 business days", note: "" },
  { region: "Belgium", sla: "7–9 business days", note: "" },
  { region: "Switzerland", sla: "~11 days", note: "Non-EU — separate route" },
  { region: "Austria", sla: "7–9 business days", note: "" },
  { region: "Portugal", sla: "7–9 business days", note: "" },
  { region: "Denmark", sla: "7–9 business days", note: "" },
  { region: "Sweden", sla: "7–9 business days", note: "" },
  { region: "Norway", sla: "~22 days", note: "Non-EU — ROW handling for returns" },
  { region: "Finland", sla: "7–9 business days", note: "" },
  { region: "Greece", sla: "7–9 business days", note: "" },
  { region: "Czech Republic", sla: "7–9 business days", note: "" },
  { region: "Poland", sla: "7–9 business days", note: "" },
  { region: "Hungary", sla: "7–9 business days", note: "" },
  // Middle East
  { region: "United Arab Emirates", sla: "~10 days", note: "ROW — refund without return" },
  { region: "Saudi Arabia", sla: "~12 days", note: "" },
  // APAC
  { region: "Hong Kong", sla: "~4 days", note: "Fastest — local fulfilment" },
  { region: "Singapore", sla: "~5 days", note: "" },
  { region: "Japan", sla: "~6 days", note: "" },
  { region: "South Korea", sla: "~7 days", note: "" },
  { region: "Taiwan", sla: "~11 days", note: "" },
  { region: "Australia", sla: "~7 days", note: "ROW — refund without return" },
  { region: "New Zealand", sla: "~8 days", note: "" },
  { region: "Malaysia", sla: "~10 days", note: "" },
  { region: "Indonesia", sla: "~8 days", note: "" },
  { region: "Philippines", sla: "~7 days", note: "" },
];

// ─── Escalation tiers (legacy) ───────────────────────────────────────
// Kept for backwards compatibility. New design uses ESCALATE_IMMEDIATELY
// + DECISION_TREE from ask-im8-knowledge.js.

export const ESCALATION = [
  {
    tier: "P1",
    label: "Escalate immediately to Head of CX",
    severity: "high",
    triggers: [
      "Adverse reaction / serious side effect",
      "Legal threat or mention of lawsuit",
      "Regulatory or government inquiry (ACCC, TGA, FDA)",
      "Media or press contact",
      "Diagnosed condition worsening / hospitalisation",
      "Compensation demand beyond a refund",
    ],
    action: "Stop. Do not troubleshoot. Issue full refund. Flag in Slack to Head of CX immediately.",
  },
  {
    tier: "P2",
    label: "Escalate to CS Manager within 2 hrs",
    severity: "med",
    triggers: [
      "Customer threatening social media post",
      "Product quality / contamination concern",
      "Repeat complaint on same issue (3+ contacts)",
      "Vulnerable customer situation",
    ],
    action: "Handle with empathy. Flag to CS Manager. Document all details in Gorgias notes.",
  },
  {
    tier: "P3",
    label: "Handle yourself",
    severity: "low",
    triggers: [
      "Shipping delays, lost packages, wrong address",
      "Subscription changes, pauses, cancellations",
      "Product questions, taste, ingredients",
      "Refund requests within policy",
      "Results questions, price objections",
    ],
    action: "Use your training, templates, and tools. Aim to resolve in one reply.",
  },
];

// ═════════════════════════════════════════════════════════════════════
// NEW DESIGN — May 2026 redesign
// ═════════════════════════════════════════════════════════════════════

// ─── Product detail cards (Products subtab) ──────────────────────────
// Richer expandable card structure. Pricing intentionally omitted —
// customers see local currency, agents pull from Shopify/Gorgias.

export const ESSENTIALS_PRO = {
  key: "pro",
  name: "Essentials PRO",
  tagline: "Daily nutritional foundation",
  stats: [
    { value: "90", label: "ingredients" },
    { value: "13.6g", label: "sachet" },
    { value: "20", label: "kcal" },
  ],
  sections: [
    {
      heading: "Format & Flavours",
      items: [
        "Sachet · 30 per pack · NSF Certified for Sport",
        "Açaí + Berry (original) · Mango + Passion fruit · Lemon + Orange · Variety Pack",
      ],
    },
    {
      heading: "Key Named Ingredients",
      items: [
        "MSM 1,500mg · CoQ10 100mg · Saffron extract 30mg",
        "Probiotics 10 billion CFU (84mg blend) · Postbiotics 25mg · CRT8™ 100mg",
        "Vitamin C 900mg · Vitamin D 50mcg · Vitamin K2 100mcg · B12 200mcg (methylcobalamin) · Folate 400mcg DFE (Quatrefolic®)",
        "Magnesium 100mg · Potassium 470mg · Zinc 15mg",
      ],
    },
    {
      heading: "Proprietary Blends (totals only)",
      items: [
        "Raw Superfoods/Greens/Fruits & Herbs — 4,100mg",
        "Hydra Electrolytes — 2,500mg",
        "Essential Amino & Renew — 1,580mg",
        "Digestive Enzymes/Adaptogens/Super Mushrooms — 200mg",
        "Cell Rejuvenation Technology 8 (CRT8™) — 100mg",
      ],
    },
    {
      heading: "Approved Health Claims (the only ones we make)",
      items: [
        "Supports Joint Comfort and Mobility",
        "Promotes a Positive Mood and Cognitive Function",
        "Supports Healthy Energy Levels and Performance",
        "Aids in Exercise Recovery",
        "Supports a Healthy Immune System",
        "Supports Digestive Health",
        "Provides Antioxidant Support",
        "Supports Bone and Cardiovascular Health",
        "Supports Healthy Skin, Hair, and Nails",
      ],
    },
  ],
};

export const LONGEVITY = {
  key: "lon",
  name: "Longevity",
  tagline: "Cellular ageing layer",
  stats: [
    { value: "5", label: "complexes" },
    { value: "7.8g", label: "sachet" },
    { value: "15", label: "kcal" },
  ],
  sections: [
    {
      heading: "Format & Flavour",
      items: [
        "Sachet · 30 per pack · Açaí + Pomegranate · NSF Sport PENDING (never confirm as certified)",
        "Grandfathered pricing: some early subscribers are on a permanently protected lower tier — if a customer mentions this, confirm in Skio, never offer it.",
      ],
    },
    {
      heading: "The 5 Synergistic Complexes",
      items: [
        "**Cellular Foundation Builder** (5g): Glycine 3g · Taurine 2g",
        "**Cellular Protection Activator / Senolytics** (600mg): Trans-Resveratrol 250mg · Quercetin 250mg · Fisetin 100mg",
        "**NMN NAD+ Energy Booster** (310mg): NMN 300mg · PQQ 10mg",
        "**Metabolic AMPK/SIRT1 Activator** (106mg): Dihydroberberine 100mg · Astaxanthin 6mg (AstaPure®)",
        "**Cellular Renewal Activator / Autophagy** (3mg): Spermidine 3mg",
      ],
    },
    {
      heading: "Other Ingredients",
      items: [
        "Natural Açaí & Pomegranate Flavor, Citric Acid, L-Malic Acid, Calcium Silicate, Fermented Sugarcane Extract, **Stevia Leaf Extract**",
        "Heads up: Longevity DOES contain Stevia Leaf Extract — flag if a customer is specifically avoiding stevia.",
      ],
    },
    {
      heading: "Approved Framing",
      items: [
        "Targets all 12 hallmarks of aging",
        "Never claim NSF Sport (still pending), never quote specific clinical study numbers beyond what's published on im8health.com/pages/science",
      ],
    },
  ],
};

export const BECKHAM_STACK = {
  key: "stack",
  name: "The Beckham Stack",
  tagline: "PRO + Longevity bundle",
  stats: [
    { value: "PRO", label: "+ Longevity" },
    { value: "Sub", label: "discount" },
  ],
  sections: [
    {
      heading: "What It Is",
      items: [
        "The Beckham Stack = Essentials PRO + Longevity bundled together.",
        "Can be mixed in the same glass.",
        "Bundle pricing is discounted vs. buying separately — exact amount varies by region/currency. Pull from the customer's order.",
      ],
    },
    {
      heading: "Discontinued (never sell these)",
      items: [
        "Original Essentials V1 · Longevity Capsules · pouch/capsule formats",
      ],
    },
  ],
};

export const PRODUCT_CARDS = [ESSENTIALS_PRO, LONGEVITY, BECKHAM_STACK];

// ─── About IM8 + Common Product Q&As ─────────────────────────────────
// `cat` matches the chip filter key. `why` is the training context.

export const ABOUT_IM8_QA = [
  {
    cat: "about",
    tag: "ABOUT IM8",
    q: "Where is IM8 made? Is it safe?",
    a: "Made in the USA in FDA-registered facilities. Our powders are produced by **Vitaquest** in New Jersey — a 40+ year leader in nutraceuticals. Every batch is third-party tested and screened against 280+ banned substances, heavy metals and contaminants. Essentials PRO is also NSF Certified for Sport.",
    why: '"Is this safe?" is really "can I trust you?". Naming the manufacturer, the country, the testing, and the certification gives them four anchors to land on. Specifics build trust faster than reassurance.',
  },
  {
    cat: "about",
    tag: "ABOUT IM8",
    q: "Where's the proof / clinical evidence?",
    a: "Both products have published clinical trials registered with the U.S. National Library of Medicine:\n\n**Essentials PRO:** 12-week randomised controlled trial, 60 adults aged 25-60, run by San Francisco Research Institute. Registry ID: **NCT06655597**.\n\n**Longevity:** 12-week safety and efficacy trial, 25 adults aged 40-70. Registry ID: **NCT06714162**.\n\nFull details: im8health.com/pages/science (or ClinicalTrials.gov by ID).",
    why: 'Skeptical customers are often won over by the registry number alone — it signals "this isn\'t marketing, it\'s verifiable." Send the link, let the rigour speak.',
  },
  {
    cat: "about",
    tag: "ABOUT IM8",
    q: "Is IM8 vegan / gluten-free / non-GMO / allergen-free?",
    a: "Yes to all four — confirmed on im8health.com/pages/quality:\n\n• **100% Vegan** (Vitamin D is VegD3® — the only pure plant-based source of D3)\n• **Gluten-Free**\n• **Non-GMO**\n• **Allergen-Free**\n• **No artificial flavours, colours, or sweeteners**\n• **No added sugar**",
    why: "Customers with dietary restrictions are doing their homework — being able to tick every box in one go (with the specifics, like VegD3®) builds confidence that we know our product.",
  },
];

export const COMMON_PRODUCT_QA = [
  // Taking it
  {
    cat: "taking",
    tag: "TAKING IT",
    q: "Can I take IM8 with my medication or supplements?",
    a: 'Always defer to their doctor: *"They\'re best placed to look at IM8 alongside your specific medications and full health history."* Share the ingredient page: im8health.com/pages/quality. Never advise on specific drug interactions.',
    why: "We never play doctor — full stop. Their GP knows their full picture, we don't. Deferring isn't a cop-out; it's the safest answer for them and for us.",
  },
  {
    cat: "taking",
    tag: "TAKING IT",
    q: "Can I take IM8 if I'm pregnant, breastfeeding, or have a medical condition?",
    a: "Always recommend they check with their doctor or midwife first. Share the ingredient panel. Do not advise directly.",
    why: 'Pregnancy and medical conditions are always a doctor\'s call — no exceptions, no "I think you\'ll be fine." Stick to the script even if the customer pushes for reassurance.',
  },
  {
    cat: "taking",
    tag: "TAKING IT",
    q: "Can I mix IM8 with hot water or coffee?",
    a: "Heat may degrade some of the nutrients and probiotics. It's recommended to mix with cold water, juice, or a smoothie.",
    why: 'Customers think they\'re being clever stirring it into coffee — we\'re protecting the efficacy they paid for. Frame it as "getting the most out of your sachet," not as a rule.',
  },
  {
    cat: "taking",
    tag: "TAKING IT",
    q: "Does IM8 replace my other supplements?",
    a: "For most people, yes — Essentials PRO replaces around 16 individual supplements (the figure quoted on the PDP). The only additions worth keeping: **omega-3**, **collagen** (if part of their routine), and **creatine** if they train heavily. Only add iron if doctor-confirmed deficiency.",
    why: "IM8 is the foundation, not the whole stack. Be confident about what it covers, honest about what it doesn't — that honesty is what builds long-term trust.",
  },
  {
    cat: "taking",
    tag: "TAKING IT",
    q: "Can I take it every day? Do I need a break?",
    a: "Yes, every day. No breaks needed. Consistency is the single biggest factor in results.",
    why: 'Most "it doesn\'t work" complaints trace back to inconsistent use. Reinforcing daily use isn\'t pushy — it\'s the single piece of advice that makes their money worth spending.',
  },
  {
    cat: "taking",
    tag: "TAKING IT",
    q: "Should I take a break after 3 months?",
    a: "No — IM8 is designed for daily long-term use. Benefits compound over time. No need to cycle on and off.",
    why: 'Customers who "take a break" often forget to come back. Reassure them daily is the design, not a sales tactic — the compounding benefit is the whole point of the product.',
  },
  // Results
  {
    cat: "results",
    tag: "RESULTS",
    q: "I've been taking it for a week and feel nothing — is that normal?",
    a: "Completely normal. Most people feel a shift at weeks 3-4. The first week is the body building a foundation. Keep going daily, ideally in the morning with food. If nothing has changed by week 4, come back to us.",
    why: "Week 1 is the #1 cancellation moment. If we set the timeline up front, customers stay long enough to actually feel it — that's the difference between a refund and a believer.",
  },
  {
    cat: "results",
    tag: "RESULTS",
    q: "What results should I expect and when?",
    a: "**Weeks 1-2:** Foundation phase — some early shifts, many feel little.\n**Weeks 3-4:** Most notice a real shift — steadier energy, better digestion, improved sleep.\n**Day 30-90:** Compounding effect. Clinical study: 95% improved energy, 85% better digestion, 80% better sleep, 75% sharper focus.\n**90+ days:** Longevity/cellular benefits compound with sustained use.",
    why: "Set expectations, don't oversell. IM8 is a slow build, not a stimulant — customers who know that going in are the ones who stay.",
  },
  {
    cat: "results",
    tag: "RESULTS",
    q: 'I don\'t feel a big "wow" effect — is it working?',
    a: "Yes — IM8 doesn't work like a stimulant. Changes are steady and cumulative. Most people look back at week 8 and realise how different they feel without being able to point to one moment. Subtle and sustained is the goal.",
    why: '"Less of the bad stuff" IS the result — fewer crashes, less brain fog, better digestion. Help them notice the absence, not chase a high.',
  },
  {
    cat: "results",
    tag: "RESULTS",
    q: "When should I feel results — at 30, 60, 90 days?",
    a: "By Day 30: steady energy through the day. By Day 60: real noticeable improvements (sleep, focus, digestion). By Day 90: this is when transformation feels meaningful — the clinical study saw the strongest gains here.",
    why: 'Giving them a mental map keeps them in the journey. Vague reassurance ("just keep going") doesn\'t — milestones do.',
  },
  // Side Effects
  {
    cat: "side-effects",
    tag: "SIDE EFFECTS",
    q: "My urine is bright yellow / neon — is that normal?",
    a: "Yes — harmless B vitamin excretion, particularly riboflavin (B2). Normal with any high-dose B vitamin supplement. If concerned, recommend doctor check. Note: may affect urine test results — advise the doctor they're taking a B vitamin supplement before any urine tests.",
    why: 'Common question, totally harmless answer — don\'t flinch. The calm, confident "yes that\'s normal, here\'s why" is what reassures them.',
  },
  {
    cat: "side-effects",
    tag: "SIDE EFFECTS",
    q: "I'm experiencing bloating / gas / loose stools.",
    a: "Common in weeks 1-2 as the gut adjusts to prebiotics and probiotics. Take with food, try half a serving for 5-7 days. Usually settles by week 3. **If severe or persistent — treat as adverse reaction, process refund.**",
    why: "Adjustment vs. adverse is the judgment call. Mild & settling = coaching. Severe, persistent, or distressing = refund + AF form, no second-guessing. When in doubt, treat it as adverse.",
  },
  {
    cat: "side-effects",
    tag: "SIDE EFFECTS",
    q: "I'm having trouble sleeping since starting IM8.",
    a: "Likely the energising B vitamins. Simple fix: take in the morning rather than afternoon or evening.",
    why: '90% of "IM8 made me anxious / kept me up" cases are timing. Solve it with a tweak before anyone reaches for the refund button.',
  },
  // Taste & Mixing
  {
    cat: "taste",
    tag: "TASTE",
    q: "The taste is unpleasant / too strong — what can I do?",
    a: "A few things that help: blend into a smoothie with frozen fruit (transforms the experience), swap to a different flavour (Lemon + Orange if currently on Açaí + Berry), or use more water (10-12 fl oz vs 8). If still not working, offer a flavour swap via Skio.",
    why: "Most 'taste' cancellations are fixable with one of these tweaks. Try the fix before you reach for the refund — but if they've tried everything, swap is better than churn.",
  },
  {
    cat: "taste",
    tag: "TASTE",
    q: "Do you have a smoothie recipe I can use with IM8?",
    a: "Yes — share this one:\n\n**IM8 berry smoothie**\n• 200ml oat milk (or milk of choice)\n• 30g Greek yoghurt\n• 1 IM8 sachet (Essentials or PRO)\n• ¼ cup raspberries\n• 4 strawberries\n• ½ banana\n• 1 scoop protein (optional)\n\nBlend and enjoy. Great for masking taste, adding texture, or making it part of a morning routine.",
    why: "Sharing a real recipe shows we drink it ourselves — it turns a transactional reply into a personal one. Use it when a customer feels stuck rather than as a default.",
  },
  {
    cat: "taste",
    tag: "TASTE",
    q: "The powder doesn't dissolve / there's sediment / white granules.",
    a: "Normal — minerals like magnesium glycinate and CoQ10 don't fully dissolve in cold water. They're still absorbed. Two tips: add powder to water (not water to powder), shake vigorously for 20-30 seconds with a metal ball shaker. A smoothie eliminates the texture entirely.",
    why: 'Customers panic that something\'s wrong with their batch. The technical "this is by design, here\'s why" calms it instantly — sounding sure matters more than the words.',
  },
];

export const PRODUCT_QA_CHIPS = [
  { key: "all", label: "All" },
  { key: "about", label: "About IM8" },
  { key: "taking", label: "Taking it" },
  { key: "results", label: "Results" },
  { key: "side-effects", label: "Side Effects" },
  { key: "taste", label: "Taste & Mixing" },
];

// ─── Policy Q&As (Policy subtab) ─────────────────────────────────────

export const POLICY_QA = [
  // Refunds (4)
  {
    cat: "refunds",
    tag: "REFUNDS",
    q: "How long is the money-back guarantee window?",
    a: "Depends on the subscription plan:\n**90-day (quarterly) subscriptions:** 90-day money-back guarantee.\n**30-day (monthly) subscriptions:** 30-day money-back guarantee.\nOne-time purchases follow the same window logic as their original plan size. Always confirm which plan the customer is on in Skio before quoting a window.",
    why: 'The window isn\'t one-size-fits-all — quoting "90 days" to a monthly subscriber sets a wrong expectation and creates a refund dispute we can\'t honour. Check the plan first, then answer.',
  },
  {
    cat: "refunds",
    tag: "REFUNDS",
    q: "Can we refund an adverse reaction outside the guarantee window?",
    a: "**Yes — always.** Adverse reactions are refunded 100% regardless of timing, order number, or how long the customer has been using the product. No exceptions.",
    why: "Safety first, always. The window doesn't apply when a customer's health is affected — and protecting that line protects the brand too.",
  },
  {
    cat: "refunds",
    tag: "REFUNDS",
    q: "Customer has 2+ orders — can we refund more than the first?",
    a: "For adverse reactions, yes — refund all affected orders. For personal reasons (taste, results, price), only the first order is eligible within the guarantee window. Repeat orders for personal reasons are a hard decline.",
    why: "The rule splits cleanly on reason, not on tenure. Adverse = unlimited. Personal preference = first order only. Don't blur the two even when the customer is frustrated.",
  },
  {
    cat: "refunds",
    tag: "REFUNDS",
    q: "Renewal order shipped — can we still refund it?",
    a: "Monthly renewal: if delivered, the customer has 7 days from delivery to submit a return via Loop. If the order hasn't shipped yet — we can't stop it, but once delivered the customer can submit a return within 7 days via Loop. After 7 days from delivery — hard decline, no exceptions.",
    why: "Loop is the system that protects us — it logs the return properly and keeps the policy consistent. Sending customers to Loop isn't a brush-off; it's how we keep things fair across the team.",
  },
  // Adverse (3)
  {
    cat: "adverse",
    tag: "ADVERSE",
    q: "Is this an adverse reaction or just an adjustment symptom?",
    a: "**Adjustment symptoms** (weeks 1-2): mild bloating, gas, loose stools, increased urination, bright yellow urine. Normal — no refund unless requested.\n**Adverse reactions:** rash, hives, heart palpitations, severe GI, breathing issues, neuropathy, bloodwork changes, ER visits. Always refund + cancel + AF form + doctor rec.\nThe rule: **if in doubt, treat it as an adverse reaction.**",
    why: "When you're 50/50, choose the refund. Over-protecting a customer's health costs us $50; under-protecting it costs us the brand. The bias should always be toward safety.",
  },
  {
    cat: "adverse",
    tag: "ADVERSE",
    q: "Rash reported — adverse reaction or not?",
    a: "Yes — any rash is treated as an adverse reaction. Process the refund (via Loop or directly — either works, no physical return required). Cancel subscription. Fill AF form. Recommend doctor. Flag Head of CX.",
    why: "Rash = no second-guessing. Run the full process every time even if it feels like overkill — the AF form is how we spot ingredient patterns across the whole customer base.",
  },
  {
    cat: "adverse",
    tag: "ADVERSE",
    q: "Customer mentions ER visits — what's the process?",
    a: "Urgent. Refund orders, cancel all subscriptions, fill in Adverse Reaction logs, flag to Head of CX immediately. Do not wait for approval to refund.",
    why: "ER = drop everything. Act first, ask permission never. Speed and warmth in this moment is what stops a bad situation becoming a legal/PR one.",
  },
  // Subscriptions (2)
  {
    cat: "subscription",
    tag: "SUBSCRIPTION",
    q: "Customer says they didn't know it was a subscription — do we refund?",
    a: "Politely note that subscription terms are disclosed at PDP, cart, checkout, order confirmation, subscription email and 3-day renewal reminder. If within 7 days of delivery — direct to Loop as a one-time exception. After 7 days — hard decline.",
    why: "Stand firm but stay warm. The disclosure was clear; the refund decision is one-time only. Politeness is not the same as flexibility — the answer is still no after 7 days.",
  },
  {
    cat: "subscription",
    tag: "SUBSCRIPTION",
    q: "Customer wants 6-month or custom frequency — how do we set it up?",
    a: "Set it up in Skio. Always add a note to the account in Gorgias with the arrangement details, any pricing agreed, and any commitments. These notes protect both the customer and the next agent.",
    why: "Notes aren't admin — they're how we keep our word. If the next agent doesn't see the deal, the customer feels gaslit. Always write it down, even if you're sure you'll remember.",
  },
  // Product (3)
  {
    cat: "product",
    tag: "PRODUCT",
    q: "Does IM8 contain stevia?",
    a: "**Depends which product.**\nEssentials PRO: no stevia, no monk fruit. Sweetened with Reb M (a high-purity steviol glycoside derived from a fermented plant source — exact source under verification, refer to im8health.com/pages/ingredients if asked).\nLongevity: contains Stevia Leaf Extract (Other Ingredients). Customers specifically avoiding stevia should be told this — don't lump the two products together.",
    why: "Honesty per-product builds trust; vague reassurance breaks it. If a customer is stevia-sensitive and we miss this, they'll lose faith in everything else we say.",
  },
  {
    cat: "product",
    tag: "PRODUCT",
    q: "Can we disclose individual ingredient amounts from proprietary blends?",
    a: "**Default: no** — we share total blend sizes, not individual amounts hidden inside them. Essentials PRO has 5 proprietary blends (Raw Superfoods, Hydra Electrolytes, Essential Amino & Renew, Digestive Enzymes, CRT8™).\n\n**Exception:** some amounts are publicly listed on im8health.com/pages/ingredients (e.g. MSM 1,500mg · CoQ10 100mg · Saffron 30mg · Probiotics 10 billion CFU · NMN 300mg · Glycine 3g · Taurine 2g · Trans-Resveratrol 250mg · Quercetin 250mg · Fisetin 100mg). If it's already on the site, you can share it. If it's not, point them to the ingredients page.",
    why: 'The formulas are our IP — but we shouldn\'t be cagey about numbers the site already publishes. The honest rule: "if it\'s on the public ingredients page, we can confirm it." Anything beyond that → defer to the page.',
  },
  {
    cat: "product",
    tag: "PRODUCT",
    q: "Customer asks if IM8 interacts with their medication — what do we say?",
    a: 'Always defer to their doctor: *"They\'re best placed to look at IM8 alongside your specific medications and full health history."* Share the ingredient page: im8health.com/pages/quality. Never advise on specific drug interactions.',
    why: 'Same answer as the Products tab — we never play doctor. Even a "should be fine" puts liability on us and the customer\'s safety at risk. Defer, share the label, stop there.',
  },
  // Escalation (3)
  {
    cat: "escalation",
    tag: "ESCALATION",
    q: "Customer is threatening legal action or mentioning ACCC/TGA/chargeback",
    a: 'Send bare minimum: *"We have received your correspondence and passed it to the appropriate team for review. With Health, Team IM8."* Do not comment on causation, liability or policy. Escalate to Head of CX immediately. Do not send anything else without approval.',
    why: 'Once the words "legal," "ACCC," "TGA," or "chargeback" appear, every reply is a legal document. Less is safer — silence is not rude here, it\'s professional.',
  },
  {
    cat: "escalation",
    tag: "ESCALATION",
    q: "Customer asking for a phone call — how do we handle it?",
    a: 'One sentence: *"Our support is available via email and chat — we\'ll make sure you get the same level of care right here."* Do not apologise twice. Do not explain why.',
    why: "We don't do phone — confidence on this matters. Apologising or over-explaining signals we're hiding something. One warm sentence and we move forward.",
  },
  {
    cat: "escalation",
    tag: "ESCALATION",
    q: "Goodwill gift vs discount code — which do we offer and when?",
    a: "**Goodwill gift** (cap/shaker/hoodie): unlikely to reorder, where a physical gesture feels right.\n**25% discount code:** may come back, where a code encourages return.\nBoth are for outside-guarantee-window only. **One per customer lifetime** — check history.",
    why: 'Choose based on the relationship, not the complaint. A gift says "thank you for trying us"; a code says "come back." Both should feel earned, not transactional — one per lifetime is what keeps them that way.',
  },
];

export const POLICY_QA_CHIPS = [
  { key: "all", label: "All" },
  { key: "refunds", label: "Refunds & Policy" },
  { key: "adverse", label: "Adverse Reactions" },
  { key: "subscription", label: "Subscriptions" },
  { key: "product", label: "Product" },
  { key: "escalation", label: "Escalation" },
];

// ─── New subtab order ────────────────────────────────────────────────
// Products is default. Non-Negotiables sits at the end — they're the
// hard rules, surfaced but not the first thing agents see.

export const PLAYBOOK_SUBTABS_NEW = [
  "Products",
  "Policy",
  "Shipping",
  "Escalation",
  "Voice",
  "Non-Negotiables",
];
