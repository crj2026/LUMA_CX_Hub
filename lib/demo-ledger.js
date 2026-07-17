// Module E — the Value Ledger. Every action the Hub logs gets a dollar
// value; this is the receipt file. All demo content, generated
// deterministically and relative-dated so the "this month" ledger is
// always full whenever the demo is opened.
//
// The categories sum exactly to the headline: 44 saves × $267 = $11,748,
// refunds avoided $3,890, 3PL recovered $1,240, hours reclaimed $1,542
// (weekly reports + Ask LUMÉ + drafting rollups) → $18,420.

import { hashSeed, mulberry32, seededSeries } from "./chart-utils.js";

export const LEDGER_RATES = [
  { event: "Cancel save logged", counted: "3 × monthly subscription value — a conservative LTV proxy, not lifetime", rate: "$267 per Hair Edit save" },
  { event: "3PL claim paid", counted: "The claim total actually reimbursed by Parcelline", rate: "actual claim $" },
  { event: "Refund avoided", counted: "The refund amount not issued after an education-first resolution on a refund-intent ticket", rate: "order / line value" },
  { event: "Ask LUMÉ answer used", counted: "6 minutes of agent time at a $38/hr loaded cost", rate: "$3.80 per answer" },
  { event: "Reply drafted", counted: "4 minutes of drafting time at $38/hr", rate: "$2.53 per draft" },
  { event: "Weekly report auto-compiled", counted: "2 hours of manager time at $55/hr", rate: "$110 per week" },
];

export const LEDGER_STANCE = "We count conservatively on purpose: a save is worth 3 months of subscription, not a lifetime; time savings use loaded cost, not billable rates; and nothing is counted twice. If the number is wrong, it's wrong on the low side.";

export const LEDGER_SUMMARY = {
  monthTotal: 18420,
  retainer: 1500,
  multiple: "12.3",
  hoursReclaimed: 41,
  breakdown: [
    { key: "saves",   label: "Revenue retained (saves)", value: 11748, detail: "44 saves × $267" },
    { key: "refunds", label: "Refunds avoided",          value: 3890,  detail: "15 education-first resolutions" },
    { key: "claims",  label: "3PL recovered",            value: 1240,  detail: "4 Parcelline claim batches paid" },
    { key: "hours",   label: "Hours reclaimed",          value: 1542,  detail: "41h of agent + manager time" },
  ],
  // 6-month trend, current month last.
  trend: seededSeries("ledgerMonths", 6, 11900, 18420, 0.03),
};

// The single biggest lever this month — fed from VoC.
export const LEDGER_TOP_ACTION = {
  title: "Add a tingling callout to the Scalp Serum PDP",
  detail: "89 mentions this month, and $1,120 of refunds trace back to customers surprised by the peppermint tingle. One line of product-page copy retires the biggest avoidable refund driver.",
  value: "$1,120/mo",
};

export const LEDGER_TYPES = [
  { value: "save",    label: "Cancel save" },
  { value: "refund",  label: "Refund avoided" },
  { value: "claim",   label: "3PL claim paid" },
  { value: "report",  label: "Weekly report compiled" },
  { value: "ask",     label: "Ask LUMÉ answers used" },
  { value: "draft",   label: "Replies drafted" },
];

const NAMES = [
  "Chloe Fitzpatrick", "James Okafor", "Sophie Brennan", "Marcus Webb", "Priya Nair",
  "Georgia Whitfield", "Liam O'Brien", "Fatima Al-Hassan", "Zoe Andersen", "Daniel Torres",
  "Niamh O'Sullivan", "Amelia Cross", "Isla Mackenzie", "Ryan Kowalski", "Casey Kim",
  "Riley Watson", "Drew Patel", "Maddison Clarke", "Ethan Rhodes", "Charlotte Ellery",
  "Harper Quinn", "Freya Dunbar", "Jack Halloran", "Mia Castellanos", "Poppy Ashworth",
];

// Refund-avoided amounts — plausible order values summing exactly to $3,890.
const REFUND_AMOUNTS = [268, 253, 329, 174, 89, 445, 164, 158, 240, 320, 89, 385, 419, 268, 289];
// 4 paid Parcelline batches summing exactly to $1,240.
const CLAIM_BATCHES = [
  { ref: "PLB-2607", amount: 412.30 },
  { ref: "PLB-2606", amount: 387.90 },
  { ref: "PLB-2605", amount: 265.20 },
  { ref: "PLB-2604", amount: 174.60 },
];
const ASK_WEEKS = [62, 55, 61, 58];   // × $3.80 = 896.80 total
const DRAFT_WEEKS = [21, 19, 21, 20]; // × $2.53 = 204.93 total

function dayAt(daysAgo, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// This month's ledger — newest first, runningTotal computed
// chronologically so the receipt reads like a bank statement.
export function ledgerEntries() {
  const rand = mulberry32(hashSeed("value-ledger"));
  const entries = [];

  // 44 cancel saves spread over the last 30 days.
  for (let i = 0; i < 44; i++) {
    const daysAgo = Math.min(29, Math.floor(i * (30 / 44)));
    const name = NAMES[Math.floor(rand() * NAMES.length)];
    entries.push({
      id: `led-save-${i}`,
      date: dayAt(daysAgo, 9 + Math.floor(rand() * 8), Math.floor(rand() * 60)),
      type: "save",
      reference: `#LME-${10480 - i * 5 - Math.floor(rand() * 4)}`,
      detail: `Hair Edit save — ${name}`,
      value: 267,
    });
  }

  // 15 refunds avoided.
  REFUND_AMOUNTS.forEach((amount, i) => {
    const daysAgo = Math.min(29, Math.floor(i * 2) + Math.floor(rand() * 2));
    const name = NAMES[Math.floor(rand() * NAMES.length)];
    entries.push({
      id: `led-ref-${i}`,
      date: dayAt(daysAgo, 9 + Math.floor(rand() * 8), Math.floor(rand() * 60)),
      type: "refund",
      reference: `ticket #${4830 - i * 9 - Math.floor(rand() * 5)}`,
      detail: `Education-first resolution — ${name}`,
      value: amount,
    });
  });

  // 4 Parcelline claim batches paid (weekly).
  CLAIM_BATCHES.forEach((c, i) => {
    entries.push({
      id: `led-claim-${i}`,
      date: dayAt(3 + i * 7, 11, 20),
      type: "claim",
      reference: c.ref,
      detail: "Parcelline claim batch reimbursed",
      value: c.amount,
    });
  });

  // Weekly rollups: report compiled, Ask LUMÉ answers, drafted replies.
  for (let w = 0; w < 4; w++) {
    const monday = (() => {
      const d = new Date();
      const backToMonday = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - backToMonday - w * 7);
      d.setHours(7, 0, 0, 0);
      return d;
    })();
    const label = monday.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
    entries.push({
      id: `led-rep-${w}`,
      date: monday,
      type: "report",
      reference: `w/c ${label}`,
      detail: "Weekly summary auto-compiled (2h manager time)",
      value: 110,
    });
    entries.push({
      id: `led-ask-${w}`,
      date: dayAt(w * 7 + 1, 17, 30),
      type: "ask",
      reference: `${ASK_WEEKS[w]} answers`,
      detail: `Ask LUMÉ answers used in tickets (${ASK_WEEKS[w]} × $3.80)`,
      value: Math.round(ASK_WEEKS[w] * 3.8 * 100) / 100,
    });
    entries.push({
      id: `led-draft-${w}`,
      date: dayAt(w * 7 + 2, 17, 45),
      type: "draft",
      reference: `${DRAFT_WEEKS[w]} drafts`,
      detail: `Customer replies drafted (${DRAFT_WEEKS[w]} × $2.53)`,
      value: Math.round(DRAFT_WEEKS[w] * 2.53 * 100) / 100,
    });
  }

  // Chronological running total, then newest first for display.
  entries.sort((a, b) => a.date - b.date);
  let running = 0;
  for (const e of entries) {
    running = Math.round((running + e.value) * 100) / 100;
    e.runningTotal = running;
    e.date = e.date.toISOString();
  }
  entries.reverse();
  return entries;
}
