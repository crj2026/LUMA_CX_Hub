// [BRAND_NAME] product catalogue — used by the log forms (Issues,
// Replacements) for SKU dropdowns.
//
// PLACEHOLDER CONTENT — replace the product names with the brand's real
// SKUs. Keep the structure intact. See BRAND_SETUP.md.

export const PRODUCT_LIST = [
  "[Product 1]",
  "[Product 2]",
  "[Product 3]",
  "[Subscription / bundle, if any]",
  "Other",
];

export const PRODUCT_LIST_SIMPLE = PRODUCT_LIST;

export const ITEM_QUANTITIES = ["x1", "x2", "x3", ">3"];

// Grouped catalogue with quantities — shown in the Records / Replacement
// SKU pickers. Group products however the brand prefers.
export const PRODUCT_CATALOGUE = [
  {
    group: "[Group 1, e.g. Core range]",
    items: [
      "[Product 1] x1", "[Product 1] x2", "[Product 1] x3",
      "[Product 2] x1", "[Product 2] x2", "[Product 2] x3",
      "[Product 3] x1", "[Product 3] x2", "[Product 3] x3",
    ],
  },
  {
    group: "[Group 2, e.g. Subscription]",
    items: [
      "[Subscription / bundle] x1",
    ],
  },
  {
    group: "Other",
    items: ["Other"],
  },
];

export const PRODUCT_CATALOGUE_SIMPLE = PRODUCT_CATALOGUE;
