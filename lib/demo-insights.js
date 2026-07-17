// Demo insights data — Gorgias / Shopify / Skio / Loop numbers for the
// LUMÉ mock brand. Single source of truth: the /api/insights/* routes
// return these objects, and the client imports them directly as initial
// state so every screen renders instantly with no loading pass.

// Gorgias ticket summary. byChannel and topTags must be plain
// { label: number } objects so sortEntries (Object.entries → sort by
// value) works correctly in the UI.
export const DEMO_SUMMARY = {
  volume: 847,
  csat: { average: 4.6, count: 312 },
  resolution: { avgSeconds: 2040, count: 724 },
  mpt: { average: 3.2, count: 724 },
  byChannel: {
    "Email":     482,
    "Chat":      241,
    "Instagram": 78,
    "Facebook":  46,
  },
  byStatus: { open: 41, pending: 82, closed: 724 },
  topTags: {
    "Order status / tracking":  237,
    "Subscription changes":     186,
    "Product questions":        152,
    "Refund requests":          119,
    "Reaction / concern":        76,
  },
  fromCache: false,
};

// Shopify order data — flat field names matching the Insights and
// Reports component contracts.
export const DEMO_SHOPIFY = {
  orders:             2847,
  refunded:           60,
  fullyRefunded:      44,
  partiallyRefunded:  16,
  refundRate:         0.021,
  refundRateDollars:  0.021,
  refundAmount:       4800,            // AUD
  cancelled:          23,
  cancelRate:         0.008,
  revenue:            233454,
  aov:                82,
  topProducts: [
    { title: "Smooth Serum",                     revenue: 74712, units: 946 },
    { title: "Repair Serum",                     revenue: 66130, units: 778 },
    { title: "The Hair Edit (Subscription Box)", revenue: 54316, units: 610 },
    { title: "Scalp Serum",                      revenue: 22757, units: 256 },
    { title: "Glow Serum",                       revenue: 15539, units: 207 },
  ],
  fromCache: false,
};

// Skio subscription data.
export const DEMO_SKIO = {
  active:           8432,
  paused:           612,
  activeAtStart:    8268,
  churnRate:        0.018,
  cancelled:        148,
  created:          312,
  netChange:        164,    // created - cancelled
  failedPayments:   34,
  mrr:              750448,
  fromCache: false,
};

// Hair Edit subscription cancellation reasons.
export const DEMO_SKIO_CANCEL_REASONS = {
  reasons: [
    { reason: "Too expensive",               count: 62, pct: 0.42 },
    { reason: "Wrong serums / bad curation", count: 34, pct: 0.23 },
    { reason: "Not using fast enough",       count: 22, pct: 0.15 },
    { reason: "No results seen yet",         count: 15, pct: 0.10 },
    { reason: "Switching products",          count: 9,  pct: 0.06 },
    { reason: "Personal / life change",      count: 6,  pct: 0.04 },
  ],
  total: 148,
  fromCache: false,
};

// Returns & refunds (Loop). topReasons is the refund-reason taxonomy —
// clean, mutually exclusive buckets with "Other" always the smallest
// slice. Counts sum to `count` (60) and amounts to `total` (4800 AUD).
export const DEMO_LOOP = {
  count: 60,
  total: 4800,   // AUD

  // Breakdown by subscription type (used by LoopRefundsCard table)
  matrix: {
    Monthly:   { count: 32, amount: 2560 },   // Hair Edit subscribers (monthly)
    Bimonthly: { count: 12, amount: 960  },   // Skip-month / bi-monthly
    Refills:   { count: 10, amount: 800  },   // Renewal orders
    OTP:       { count: 6,  amount: 480  },   // One-time purchases
  },

  topReasons: [
    { reason: "Product not suitable for hair type",  count: 18, amount: 1440 },
    { reason: "No results seen yet",                 count: 14, amount: 1120 },
    { reason: "Adverse reaction / sensitivity",      count: 11, amount: 880  },
    { reason: "Changed mind / too many products",    count: 8,  amount: 640  },
    { reason: "Shipping took too long",              count: 5,  amount: 400  },
    { reason: "Received wrong item",                 count: 3,  amount: 240  },
    { reason: "Other",                               count: 1,  amount: 80   },
  ],

  operations: {
    submitted:        60,
    approved:         52,
    rejected:         8,
    restockedCount:   44,
    handlingFeesTotal: 0,
  },

  fromCache: false,
};

// CX trend themes from customer messages this week.
export const DEMO_TRENDS = {
  themes: [
    {
      theme: "Scalp Serum tingling sensation",
      volume: 89,
      sentiment: "neutral",
      summary: "High volume of customers asking about tingling from peppermint oil in Scalp Serum. Reassurance resolving tickets well — consider adding FAQ to product page to reduce inbound.",
    },
    {
      theme: "Repair Serum results timeline — week 3–4 cluster",
      volume: 67,
      sentiment: "negative",
      summary: "Customers at the 3–4 week mark expressing frustration with results. Expected spike. Timeline education (strength visible at 6 weeks) is resolving most. Consider proactive email at week 3.",
    },
    {
      theme: "Hair Edit swap requests — approaching 12th cutoff",
      volume: 44,
      sentiment: "neutral",
      summary: "Swap request volume spiking as the 12th approaches. Agents processing well. Consider a reminder email on the 10th to reduce inbound before the cutoff.",
    },
    {
      theme: "Failed payment follow-up",
      volume: 34,
      sentiment: "negative",
      summary: "Failed payments up 18% vs last week. Customers receiving automated dunning but some not re-engaging. Proactive outreach campaign recommended.",
    },
    {
      theme: "Subscription cancellation saves — positive",
      volume: 28,
      sentiment: "positive",
      summary: "Save rate sitting at 43% this week, up from 38% last week. Wrong serum saves particularly effective at 61%. Team is executing save plays well.",
    },
  ],
  fromCache: false,
};
