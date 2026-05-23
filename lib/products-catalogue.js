// Product catalogue — the SKU + flavour + pack list used by:
//   - Issues log "Items Affected" multi-select
//   - Replacements log "Sub Reason" item-specific options
//   - Anywhere else we need a canonical product list
//
// Aina's testing feedback (May 13) — the previous free-text fields
// turned messy because every agent typed something different. This
// list is the single source of truth.
//
// Adding a new SKU? Add it here once, every consumer picks it up.

// Essentials PRO flavours
export const PRO_FLAVOURS = [
  "Açaí + Berry",
  "Lemon + Orange",
  "Mango + Passion Fruit",
  "Variety Pack",
];

// Quantities used for damaged/missing item logging
export const ITEM_QUANTITIES = ["x1", "x2", "x3", ">3"];

// Build the per-flavour × quantity list for refill-style SKUs
function expandRefill(label, flavours = PRO_FLAVOURS, qtys = ITEM_QUANTITIES) {
  return flavours.flatMap((f) =>
    qtys.map((q) => `${label} (${f}) ${q}`)
  );
}

// ─── The full SKU list (flattened, alphabetised for the dropdown) ───
// Pulled from the Replacement Tab patterns Aina sent + our current
// PDP catalogue. Group → label structure so the dropdown can render
// optgroup headers later if needed.

export const PRODUCT_CATALOGUE = [
  // ─── Essentials PRO ───
  {
    group: "Essentials PRO — Refill",
    items: expandRefill("Essentials 30-day Refill"),
  },
  {
    group: "Essentials PRO — Refill (90-day)",
    items: expandRefill("Essentials 90-day Refill"),
  },
  {
    group: "Essentials PRO — Starter / OTP / 7-pack",
    items: [
      ...PRO_FLAVOURS.map((f) => `Essentials 90-day Starter (${f})`),
      ...PRO_FLAVOURS.map((f) => `Essentials OTP (${f})`),
      ...PRO_FLAVOURS.map((f) => `Essentials 7-pack (${f})`),
      "Essentials Pouch",
    ],
  },

  // ─── Longevity ───
  {
    group: "Longevity",
    items: [
      "Longevity 30-day Refill x1",
      "Longevity 30-day Refill x2",
      "Longevity 30-day Refill x3",
      ">3",
      "Longevity 90-day Refill",
      "Longevity 90-day Starter",
      "Longevity OTP",
      "Longevity 6-pack",
      "Longevity 7-pack",
    ].map((s, i) => (i === 3 ? "Longevity 30-day Refill >3" : s)), // tidy the >3 entry
  },

  // ─── Beckham Stack ───
  // Per Aina (May 15) — DB Stack has flavour variants, so it should
  // follow Essentials' shape: Refill and Starter as separate groups,
  // each flavour-expanded, plus the standalone OTP. The flavour set
  // matches Essentials (PRO_FLAVOURS).
  {
    group: "The Beckham Stack — 30-day Refill",
    items: PRO_FLAVOURS.map((f) => `DB Stack 30-day Refill (${f})`),
  },
  {
    group: "The Beckham Stack — 30-day Starter",
    items: PRO_FLAVOURS.map((f) => `DB Stack 30-day Starter (${f})`),
  },
  {
    group: "The Beckham Stack — 90-day Refill",
    items: PRO_FLAVOURS.map((f) => `DB Stack 90-day Refill (${f})`),
  },
  {
    group: "The Beckham Stack — 90-day Starter",
    items: PRO_FLAVOURS.map((f) => `DB Stack 90-day Starter (${f})`),
  },
  {
    group: "The Beckham Stack — OTP",
    items: ["DB Stack OTP"],
  },

  // ─── Accessories / Perks ───
  // History: Aina originally asked to merge Mixer + Shaker (May 13).
  // Cherie overrode that on May 15 — said keep both since the V3 Bottle
  // is a separate thing again. Now (May 18) Aina has asked to drop
  // Shaker from this dropdown after testing — so we're at Mixer, V3
  // Bottle, Mystery Gift, Other. The "Damaged Shaker" sub-reason in
  // replacement-reasons.js still exists — leaving it for now in case
  // legacy rows reference it. Easy to drop if/when Cherie confirms.
  {
    group: "Accessories & perks",
    items: [
      "Mixer",
      "V3 Bottle",
      "Mystery Gift",
      "Other",
    ],
  },
];

// Flat list — useful for searching / single dropdown rendering
export const PRODUCT_LIST = PRODUCT_CATALOGUE.flatMap((g) => g.items);

// ─── Simplified SKU list (no flavour/quantity expansion) ───
// Per Aina (May 18): Issues "Items Affected" doesn't need x1/x2/x3
// quantity info (that's only useful for Replacements where we have to
// know how many to ship). And the Replacement "Original order reference"
// field — previously free-text — should also be a dropdown of these
// same simple SKU names.
//
// Source: Aina's reference image, 2026-05-18. NOTE: includes Essentials
// 60-day Starter/Refill — Cherie had previously said "skip 60-day for
// now" (May 16). If 60-day isn't a real SKU, drop the two lines below.
export const PRODUCT_CATALOGUE_SIMPLE = [
  {
    group: "The Beckham Stack",
    items: [
      "DB Stack 90-day Starter",
      "DB Stack 90-day Refill",
      "DB Stack 30-day Starter",
      "DB Stack 30-day Refill",
      "DB Stack OTP",
    ],
  },
  {
    group: "Essentials PRO",
    items: [
      "Essentials 90-day Starter",
      "Essentials 90-day Refill",
      "Essentials 60-day Starter",
      "Essentials 60-day Refill",
      "Essentials 30-day Starter",
      "Essentials 30-day Refill",
      "Essentials OTP",
      "Essentials Pouch",
    ],
  },
  {
    group: "Longevity",
    items: [
      "Longevity 90-day Starter",
      "Longevity 90-day Refill",
      "Longevity 30-day Starter",
      "Longevity 30-day Refill",
      "Longevity OTP",
    ],
  },
];

// Flat version of the same — useful for the Replacement form's
// "Original order reference" single-select dropdown.
export const PRODUCT_LIST_SIMPLE = PRODUCT_CATALOGUE_SIMPLE.flatMap((g) => g.items);
