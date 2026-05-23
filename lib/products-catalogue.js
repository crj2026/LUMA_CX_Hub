// Product catalogue — placeholder for client deployments.
// Replace with the client's actual SKU list and product structure.

export const PRODUCT_LIST = [
  "[Client Product A]",
  "[Client Product B]",
  "[Client Product C]",
  "[Client Product D]",
  "Other",
];

export const PRODUCT_LIST_SIMPLE = PRODUCT_LIST;

export const ITEM_QUANTITIES = ["x1", "x2", "x3", ">3"];

export const PRODUCT_CATALOGUE = [
  {
    group: "Products",
    items: PRODUCT_LIST.flatMap(p =>
      ITEM_QUANTITIES.map(q => `${p} ${q}`)
    ),
  },
];

export const PRODUCT_CATALOGUE_SIMPLE = PRODUCT_CATALOGUE;
