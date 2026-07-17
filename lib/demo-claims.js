// Module A — 3PL Claims & Recovery. LUMÉ's 3PL is Parcelline (all three
// warehouses); claims are filed per order with item-level landed costs
// and batched weekly as CSV to Parcelline's claims team.

import { hoursAgo, daysAgo } from "./demo-dates.js";

export const CLAIM_CATEGORIES = [
  { value: "lost-in-transit",     label: "Lost in transit" },
  { value: "damaged-in-warehouse", label: "Damaged in warehouse" },
  { value: "short-shipped",       label: "Short-shipped" },
  { value: "wrong-item-picked",   label: "Wrong item picked" },
  { value: "leaked-bottle-wh",    label: "Leaked bottle (warehouse fault)" },
  { value: "carton-damage",       label: "Carton damage" },
];

export const CLAIM_STATUSES = [
  { value: "draft",        label: "Draft" },
  { value: "submitted",    label: "Submitted" },
  { value: "approved",     label: "Approved" },
  { value: "paid",         label: "Paid" },
  { value: "rejected",     label: "Rejected" },
  { value: "cost-pending", label: "Cost pending in Parcelline OMS" },
];

// SKU → landed cost (the amount claimable from Parcelline).
export const SKU_COSTS = [
  { sku: "LME-SMO-50",   label: "Smooth Serum 50ml",  cost: 14.20 },
  { sku: "LME-REP-50",   label: "Repair Serum 50ml",  cost: 15.80 },
  { sku: "LME-SCA-30",   label: "Scalp Serum 30ml",   cost: 16.40 },
  { sku: "LME-GLO-50",   label: "Glow Serum 50ml",    cost: 13.10 },
  { sku: "LME-EDIT-BOX", label: "The Hair Edit box",  cost: 27.50 },
];

export function skuCost(sku) {
  return SKU_COSTS.find((s) => s.sku === sku)?.cost ?? 0;
}

export function currencyForWarehouse(warehouse) {
  if (String(warehouse).startsWith("US")) return "USD";
  if (String(warehouse).startsWith("UK")) return "GBP";
  return "AUD";
}

export function claimTotal(items) {
  return Math.round((items || []).reduce((a, it) => a + skuCost(it.sku) * (it.qty || 1), 0) * 100) / 100;
}

// 8 seeded claims, relative-dated (2 today · 3 in 1–3d · 2 in 4–7d · 1 older).
export function claimsSeed() {
  return [
    { id: "demo-clm-001", claimRef: "PLC-2418", createdAt: hoursAgo(2, 5),  orderId: "#LME-10471", ticketId: "4811", warehouse: "US — Los Angeles", category: "lost-in-transit",      items: [{ sku: "LME-EDIT-BOX", qty: 1 }], status: "paid",         evidenceUrls: ["https://drive.google.com/lume-claims/plc-2418"], notes: "Courier scan chain ends at LAX sort facility. Replacement already shipped to customer.", agent: "demo" },
    { id: "demo-clm-002", claimRef: "PLC-2417", createdAt: hoursAgo(5, 40), orderId: "#LME-10468", ticketId: "4807", warehouse: "AU — Sydney",      category: "damaged-in-warehouse", items: [{ sku: "LME-SMO-50", qty: 2 }],   status: "approved",     evidenceUrls: ["https://drive.google.com/lume-claims/plc-2417"], notes: "Both bottles crushed before despatch — outer carton intact, warehouse handling fault.", agent: "demo" },
    { id: "demo-clm-003", claimRef: "PLC-2416", createdAt: daysAgo(1, 14, 20), orderId: "#LME-10455", ticketId: "4795", warehouse: "UK — London",   category: "short-shipped",        items: [{ sku: "LME-REP-50", qty: 1 }],   status: "submitted",    evidenceUrls: [], notes: "Pick list shows 3 units, customer received 2. Unboxing video on ticket.", agent: "demo" },
    { id: "demo-clm-004", claimRef: "PLC-2415", createdAt: daysAgo(2, 10, 45), orderId: "#LME-10442", ticketId: "4780", warehouse: "AU — Sydney",   category: "wrong-item-picked",    items: [{ sku: "LME-SCA-30", qty: 1 }],   status: "paid",         evidenceUrls: ["https://drive.google.com/lume-claims/plc-2415"], notes: "Photo of received label vs order confirms pick error.", agent: "demo" },
    { id: "demo-clm-005", claimRef: "PLC-2414", createdAt: daysAgo(3, 16, 10), orderId: "#LME-10435", ticketId: "4772", warehouse: "US — Los Angeles", category: "leaked-bottle-wh",  items: [{ sku: "LME-SCA-30", qty: 1 }],   status: "cost-pending", evidenceUrls: ["https://drive.google.com/lume-claims/plc-2414"], notes: "Seal applied crooked at fill line — warehouse fault per Parcelline QA. Awaiting OMS costing.", agent: "demo" },
    { id: "demo-clm-006", claimRef: "PLC-2413", createdAt: daysAgo(5, 11, 30), orderId: "#LME-10416", ticketId: "4752", warehouse: "UK — London",   category: "carton-damage",        items: [{ sku: "LME-GLO-50", qty: 3 }],   status: "approved",     evidenceUrls: ["https://drive.google.com/lume-claims/plc-2413"], notes: "Carton stack-crushed in the London racking — three units unsellable.", agent: "demo" },
    { id: "demo-clm-007", claimRef: "PLC-2412", createdAt: daysAgo(7, 9, 15), orderId: "#LME-10397", ticketId: "4723", warehouse: "AU — Sydney",    category: "lost-in-transit",      items: [{ sku: "LME-REP-50", qty: 1 }, { sku: "LME-GLO-50", qty: 1 }], status: "submitted", evidenceUrls: [], notes: "No scan after Sydney despatch. AusPost investigation ref attached to ticket.", agent: "demo" },
    { id: "demo-clm-008", claimRef: "PLC-2411", createdAt: daysAgo(12, 13, 50), orderId: "#LME-10359", ticketId: "4686", warehouse: "US — Los Angeles", category: "damaged-in-warehouse", items: [{ sku: "LME-EDIT-BOX", qty: 1 }], status: "draft",     evidenceUrls: [], notes: "Awaiting photos from customer before submitting.", agent: "demo" },
  ].map((c) => ({ ...c, claimTotalValue: claimTotal(c.items), currency: currencyForWarehouse(c.warehouse) }));
}

// Reports · Recovery stats.
export const RECOVERY_STATS = {
  recoveredQuarter: 1240,
  monthlyTrend: [285, 342, 613],   // last 3 months, current last
  claimsFiled: 23,
  approvalRate: 0.78,
  avgDaysToReimbursement: 9,
  caption: "Money your 3PL owes you, tracked to the dollar — not lost in a spreadsheet.",
};
