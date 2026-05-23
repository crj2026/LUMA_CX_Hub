// Replacement reasons taxonomy.
//
// Two-tier structure (Main Reason → Sub Reason), both multi-select,
// based on Aina's IM8 CS Issue and Refund Log (Replacement Tab) — May 2026.
//
// Item-specific Subs (Damaged Item / Missing Item) pull from
// PRODUCT_LIST in products-catalogue.js so the SKU list stays unified.
//
// Per Cherie (May 13): "Damaged Item (Hardened Sachet)" + "Damaged Item
// (Leaked Sachet)" merged into ONE Main = "Damaged Item" with sub-issue
// chips, then the affected item is captured via the Items Affected
// multi-select on the form.

import { PRODUCT_LIST } from "./products-catalogue.js";

export const REPLACEMENT_MAIN_REASONS = [
  {
    value: "damaged-item",
    label: "Damaged Item",
    subs: [
      "Hardened Sachet",
      "Leaked Sachet",
      "Leaked Pouch",
      "Damaged Mixer",
      "Damaged Shaker",
      "Damaged V3 Bottle",
      "Other damaged product",
    ],
  },
  {
    value: "damaged-package",
    label: "Damaged Package",
    subs: [
      "Box crushed / torn",
      "Box opened / tampered",
      "Box wet / water damaged",
      "Seal broken on arrival",
    ],
  },
  {
    value: "lost-package",
    label: "Lost Package",
    subs: [
      "Stolen by courier",
      "Stolen by non-courier",
      "Confirmed by courier",
      "Misdelivery",
    ],
  },
  {
    value: "missing-item",
    label: "Missing Item",
    // Sub = which item(s) are missing — uses the shared product list
    subs: [...PRODUCT_LIST],
  },
  {
    value: "wrong-product-ordered",
    label: "Wrong Product Ordered",
    subs: ["Customer Error"],
  },
  {
    value: "wrong-address",
    label: "Wrong Address",
    subs: ["Customer Error"],
  },
  {
    value: "shipment-delay",
    label: "Shipment Delay",
    subs: [">1 week", ">2 weeks"],
  },
  {
    value: "rts",
    label: "RTS (Return to Sender)",
    subs: ["No reason stated"],
  },
  {
    value: "special-perks",
    label: "Special Perks",
    subs: ["Token of Appreciation"],
  },
  {
    value: "accidental-customer-damage",
    label: "Accidental Damage by Customer",
    subs: [], // standalone — no sub required
  },
];

// Helper — get Subs available given a set of selected Mains
export function getSubsForMains(selectedMainValues) {
  const set = new Set(selectedMainValues);
  return REPLACEMENT_MAIN_REASONS
    .filter((m) => set.has(m.value))
    .flatMap((m) => m.subs.map((sub) => ({ value: `${m.value}::${sub}`, label: sub, main: m.value })));
}
