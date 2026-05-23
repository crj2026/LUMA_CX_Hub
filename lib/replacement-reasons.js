// Replacement reasons taxonomy for LUMÉ haircare.
//
// Two-tier structure (Main Reason → Sub Reason), both multi-select.
// Covers the common fulfilment and product issues for the Hair Edit
// subscription and one-time serum orders.

import { PRODUCT_LIST } from "./products-catalogue.js";

export const REPLACEMENT_MAIN_REASONS = [
  {
    value: "damaged-item",
    label: "Damaged Item",
    subs: [
      "Broken pump mechanism",
      "Leaked bottle (in transit)",
      "Cracked bottle",
      "Lid missing / cracked",
      "Other damaged product",
    ],
  },
  {
    value: "damaged-package",
    label: "Damaged Packaging",
    subs: [
      "Box crushed / torn",
      "Box opened / tampered",
      "Box wet / water damaged",
      "Gifting packaging damaged",
    ],
  },
  {
    value: "lost-package",
    label: "Lost Package",
    subs: [
      "Confirmed by courier",
      "Stolen",
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
    value: "wrong-product",
    label: "Wrong Product / Wrong Serums",
    subs: ["Fulfilment error", "Customer error"],
  },
  {
    value: "wrong-address",
    label: "Wrong Address",
    subs: ["Customer error", "System error"],
  },
  {
    value: "shipment-delay",
    label: "Shipment Delay",
    subs: [">1 week", ">2 weeks", "No tracking update"],
  },
  {
    value: "rts",
    label: "RTS (Return to Sender)",
    subs: ["No reason stated"],
  },
  {
    value: "goodwill",
    label: "Goodwill / Token of Appreciation",
    subs: ["VIP gesture", "Apology for poor experience"],
  },
  {
    value: "accidental-customer-damage",
    label: "Accidental Damage by Customer",
    subs: [],
  },
];

// Helper — get Subs available given a set of selected Mains
export function getSubsForMains(selectedMainValues) {
  const set = new Set(selectedMainValues);
  return REPLACEMENT_MAIN_REASONS
    .filter((m) => set.has(m.value))
    .flatMap((m) => m.subs.map((sub) => ({ value: `${m.value}::${sub}`, label: sub, main: m.value })));
}
