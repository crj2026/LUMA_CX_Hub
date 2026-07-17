"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  NON_NEGOTIABLES, VOICE_PAIRS, PRODUCTS, SHIPPING_ROWS, ESCALATION,
  PRODUCT_CARDS, ABOUT_BRAND_QA, COMMON_PRODUCT_QA, PRODUCT_QA_CHIPS,
  POLICY_QA, POLICY_QA_CHIPS, PLAYBOOK_SUBTABS_NEW,
} from "../lib/playbook-data";
import { AFFILIATES_DATA } from "../lib/affiliates-data";
import { PRODUCT_LIST, PRODUCT_CATALOGUE, PRODUCT_CATALOGUE_SIMPLE, PRODUCT_LIST_SIMPLE } from "../lib/products-catalogue";
import { REPLACEMENT_MAIN_REASONS, getSubsForMains } from "../lib/replacement-reasons";
import {
  buildAskLumaSystem,
  SHIPPING_LEAD_TIMES,
  ESCALATE_IMMEDIATELY,
  DECISION_TREE,
  VOICE_RULES,
  TOOLKIT,
} from "../lib/ask-luma-knowledge";
import { warehouseFromCountry, WAREHOUSES, dateDaysAgo } from "../lib/demo-dates";
import {
  issuesSeed, replacementsSeed, cancellationsSeed, feedbackSeed,
  orderRequestsSeed, adverseReactionsSeed, cancelNoRefundSeed,
} from "../lib/demo-logs";
import {
  DEMO_SUMMARY, DEMO_SHOPIFY, DEMO_SKIO, DEMO_SKIO_CANCEL_REASONS,
  DEMO_LOOP, DEMO_TRENDS, DEMO_TREND,
} from "../lib/demo-insights";
import { sparklinePath } from "../lib/chart-utils";
import {
  LEDGER_RATES, LEDGER_STANCE, LEDGER_SUMMARY, LEDGER_TOP_ACTION,
  LEDGER_TYPES, ledgerEntries,
} from "../lib/demo-ledger";
import {
  CLAIM_CATEGORIES, CLAIM_STATUSES, SKU_COSTS, skuCost,
  currencyForWarehouse, claimTotal, claimsSeed, RECOVERY_STATS,
} from "../lib/demo-claims";
import { VOC_WEIGHTING, VOC_MONTHS } from "../lib/demo-voc";
import {
  retentionCohorts, SAVE_PLAY_OUTCOMES, SKIPPED_SUBS, winbackList,
} from "../lib/demo-retention";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const RED  = "#B44444";
const BURG = "#0A0A09";
const GOLD = "#C4A96B";
const CREAM = "#F4F0E8";
const W = "#FAF8F3";
const F = {
  sans:  "'DM Sans','Arial',sans-serif",
  serif: "'Cormorant Garamond','Georgia',serif",
};
const HEADER_GRAD = "#FAF8F3";
const HERO_GRAD   = "#F4F0E8";

// ─── Constants ───────────────────────────────────────────────────────────────
const LB_KEY = "luma_cx_lb_v1";
const TABS = ["Home","Insights","Reports","Logs","Records","Ask LUMÉ","Playbook","Affiliates","Training","Team"];
// Roles list mirrored from lib/auth.js — kept inline so the client bundle
// doesn't have to pull in the server-only helpers from that module.
const TEAM_ROLES = ["New Starter", "Agent", "Ops", "Lead Agent", "Manager", "Admin", "Owner"];
// Hidden until those features are ready — flip individual entries to false
// to surface them again.
const HIDDEN_TABS = { "Ask LUMÉ": true, "Playbook": false, "Training": false, "Affiliates": true };
// Single source of truth for tab access, shared by the tab bar filter and
// the redirect-on-preview effect so gated content can never stay mounted
// for a role that shouldn't see it.
function canAccessTab(t, r) {
  if (HIDDEN_TABS[t]) return false;
  // Ops sees a focused view: only Home + Logs
  if (r === "Ops") return t === "Home" || t === "Logs";
  if (t === "Logs") return r !== "New Starter";
  if (t === "Reports") return !!r && ["Lead Agent", "Manager", "Admin", "Owner"].includes(r);
  if (t === "Records") return !!r && ["Manager", "Admin", "Owner"].includes(r);
  // Affiliates playbook — Manager and above (Cherie May 22: bumped from
  // Lead Agent+ to Manager+ while the workstream is being re-scoped).
  if (t === "Affiliates") return !!r && ["Manager", "Admin", "Owner"].includes(r);
  // Team management — Admin + Owner only
  if (t === "Team") return !!r && ["Admin", "Owner"].includes(r);
  return true;
}
const BC_KEY = "luma_cx_bc_v1";
const BC_PASS = 0.75;

// ─── Quiz Data ────────────────────────────────────────────────────────────────
// LUMÉ training content. Compact placeholder set — the Training tab is
// feature-flagged off and gets its full 30-day curriculum in Module B.
const MODULES = [
  {
    id: "m1", title: "Brand, Voice and Values", day: 1,
    tag: "Day 1 - Foundation", critical: false,
    questions: [
      { q: "What is LUMÉ's brand promise?", options: ["Salon results at home", "Your hair, transformed.", "Clean beauty for everyone", "Hair science, simplified"], correct: 1, exp: "The LUMÉ promise is 'Your hair, transformed.' Every interaction should feel like a step toward that." },
      { q: "The LUMÉ voice is best described as:", options: ["Formal and clinical", "Playful and cheeky", "Warm, knowledgeable, confident", "Apologetic and cautious"], correct: 2, exp: "Warm, knowledgeable, confident. Never clinical, never preachy. We solve — we don't apologise unnecessarily." },
      { q: "A customer writes 'Love the serum but delivery took ages.' Do you send the Trustpilot link?", options: ["Yes — mostly positive", "Yes — delivery gripes are minor", "No — any negative means no link", "Only if they rate 5 stars"], correct: 2, exp: "Strict rule: the Trustpilot invite goes only on 100% positive messages. Any complaint, however small, disqualifies." },
      { q: "Which sign-off is correct?", options: ["Best regards, LUMÉ Support", "Warmly, [Your first name] — LUMÉ", "Thanks, Customer Care", "Sincerely, The Team"], correct: 1, exp: "Every reply signs off: Warmly, [Your first name] — LUMÉ. Personal, consistent, on-brand." },
    ],
  },
  {
    id: "m2", title: "Products and Hair Science", day: 2,
    tag: "Day 2 - Product Knowledge", critical: true,
    questions: [
      { q: "A customer reports tingling after applying Scalp Serum. What's true?", options: ["It's an adverse reaction — escalate immediately", "The peppermint tingle is expected and a sign actives are working — reassure, and flag only if it's painful", "They should stop use permanently", "Offer a refund straight away"], correct: 1, exp: "The peppermint tingle is a feature, not a fault. Reassure and educate. Pain, burning, or a rash is different — that becomes a Reaction/Concern log." },
      { q: "When should customers expect visible results?", options: ["After 2-3 washes", "Within a week", "At 4-6 weeks of consistent use", "Only after 6 months"], correct: 2, exp: "The results timeline is 4-6 weeks of consistent use. Week-3 'no results yet' contacts get timeline education, not a refund-first response." },
      { q: "What does The Hair Edit box cost and when does it ship?", options: ["$75/month, ships the 1st", "$89/month, ships the 15th", "$99/month, ships the 12th", "$85/month, ships the 20th"], correct: 1, exp: "The Hair Edit is $89/month and ships on the 15th. Serum swaps close on the 12th." },
      { q: "Which serum pairs with colour-treated or bleach-damaged hair?", options: ["Smooth Serum", "Glow Serum", "Repair Serum", "Scalp Serum"], correct: 2, exp: "Repair Serum ($85) is the pick for damaged and colour-treated hair. Smooth for frizz, Glow for shine, Scalp for scalp health." },
      { q: "A customer uses minoxidil. Can they use Scalp Serum?", options: ["No — never together", "Yes — apply at different times of day", "Only with a doctor's letter", "Yes — mix them together"], correct: 1, exp: "Yes, at different times of day (e.g. minoxidil morning, Scalp Serum evening). Never give medical advice beyond the playbook line — refer to their GP for anything further." },
    ],
  },
  {
    id: "m3", title: "Policy and Escalation", day: 3,
    tag: "Day 3 - Playbook", critical: true,
    questions: [
      { q: "What is LUMÉ's guarantee window?", options: ["14 days from order", "30 days from delivery", "60 days from delivery", "90 days from order"], correct: 1, exp: "30 days from delivery, opened or unopened. Outside the window: education first, then store credit at your discretion — cash refunds outside 30 days escalate to a Lead." },
      { q: "A customer reports a painful reaction with a rash. Your first move?", options: ["Offer 20% off their next order", "Log a Reaction/Concern record verbatim, process the refund, and escalate within 1 hour", "Ask for photos and wait", "Suggest they use less product"], correct: 1, exp: "Adverse reactions are compliance events: capture the customer's words verbatim, refund, and escalate within the hour. No save attempts." },
      { q: "Tracking says delivered but nothing arrived. The flow is:", options: ["Refund immediately", "Confirm address, ask them to check neighbours/building, wait 24h, then send a free replacement", "Tell them to contact the courier", "Open a fraud investigation"], correct: 1, exp: "Confirm the address, check neighbours and safe spots, allow 24 hours for late scans — then a free replacement. Log it so the Parcelline claim can be filed." },
      { q: "A subscriber wants to cancel because they have too much product. Best save play?", options: ["Offer 40% off", "Offer to skip a month or move to bi-monthly shipping", "Process the cancellation immediately", "Transfer to a Manager"], correct: 1, exp: "Excess product is the highest-save category: skip a month, pause, or drop to bi-monthly. One genuine save attempt, then respect the decision." },
      { q: "How many save attempts per cancellation?", options: ["As many as it takes", "Two, then escalate", "One genuine attempt, then cancel respectfully if declined", "None — always cancel instantly"], correct: 2, exp: "One save attempt maximum. Push twice and you've traded a customer's trust for a month of revenue." },
    ],
  },
];

// ─── Simulate Data ───────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: "s1",  label: "Tingling + Refund Ask",   difficulty: "Medium", customerMsg: "My scalp tingles every time I use the Scalp Serum. That can't be normal. I want a refund." },
  { id: "s2",  label: "No Results — Week 3",     difficulty: "Hard",   customerMsg: "I've used the Repair Serum every day for 3 weeks and my hair looks exactly the same. It's not working." },
  { id: "s3",  label: "Wrong Serums in Edit Box", difficulty: "Medium", customerMsg: "My Hair Edit box came with serums for fine hair. My profile clearly says my hair is coily. Did anyone even look?" },
  { id: "s4",  label: "Cancel — Formula Swap Save", difficulty: "Hard", customerMsg: "I want to cancel my subscription. The serums just aren't right for my hair since I got a keratin treatment." },
  { id: "s5",  label: "Adverse Reaction",        difficulty: "Hard",   customerMsg: "I've come out in a rash along my hairline after using the Glow Serum. It's itchy and red and I'm honestly upset." },
  { id: "s6",  label: "Affiliate Code Failure",  difficulty: "Easy",   customerMsg: "My friend's creator code LUMEJESS didn't apply at checkout and I got charged full price. Can you fix it?" },
  { id: "s7",  label: "Damaged Gift Order",      difficulty: "Medium", customerMsg: "The box arrived crushed and it was meant to be a birthday gift for my sister this weekend. I'm gutted." },
  { id: "s8",  label: "Skip vs Pause vs Cancel", difficulty: "Easy",   customerMsg: "I still have two full bottles left. It seems really hard to stop deliveries — how do I cancel?" },
  { id: "s9",  label: "Refund Outside 30 Days",  difficulty: "Medium", customerMsg: "I bought the Smooth Serum 45 days ago and it's not for me. I'd like my money back please." },
  { id: "s10", label: "Chargeback Threat",       difficulty: "Hard",   customerMsg: "If I don't get a refund today I'm calling my bank and disputing the charge. Your choice." },
];

// ─── Compare Data ─────────────────────────────────────────────────────────────
// Serum-by-serum comparison for the Training compare matrix.
const COMPARE_ROWS = [
  { label: "Best for",         smooth: "Frizz + flyaways",        repair: "Damage + colour-treated",  scalp: "Scalp health + growth",    glow: "Shine + dullness" },
  { label: "Hero ingredient",  smooth: "Argan + keratin complex", repair: "Bond-repair peptides",     scalp: "Peppermint + niacinamide", glow: "Camellia oil + vitamin E" },
  { label: "Texture",          smooth: "Silky cream-serum",       repair: "Rich leave-in",            scalp: "Lightweight dropper",      glow: "Weightless oil mist" },
  { label: "Apply to",         smooth: "Damp hair, mid-to-ends",  repair: "Damp hair, ends first",    scalp: "Dry or damp scalp",        glow: "Dry hair, finishing" },
  { label: "What to expect",   smooth: "Smoother from first use", repair: "Strength visible ~6 weeks", scalp: "Expected tingle (peppermint)", glow: "Instant gloss" },
  { label: "Results timeline", smooth: "1-2 weeks",               repair: "4-6 weeks",                scalp: "4-6 weeks",                glow: "Immediate" },
  { label: "Price (AUD)",      smooth: "$79",                     repair: "$85",                      scalp: "$89",                      glow: "$75" },
  { label: "Hair Edit pairing", smooth: "Fine + straight profiles", repair: "Damaged + coloured profiles", scalp: "Thinning + scalp-first profiles", glow: "All profiles (finisher)" },
];

// ─── Bootcamp Data ────────────────────────────────────────────────────────────
// Four compact days — one per week of the 30-day path. Module B replaces
// this with the full curriculum.
const BOOTCAMP_DAYS = [
  {
    day: 1, title: "Week 1 — Foundations",
    subtitle: "Meet LUMÉ, learn the voice, and get product-fluent", duration: "2-3 hrs",
    lessons: [
      {
        id: "d1l0", title: "Meet LUMÉ",
        content: [
          { t: "h", v: "Welcome to the LUMÉ CX team" },
          { t: "p", v: "LUMÉ is a premium DTC haircare brand — four serums and The Hair Edit subscription box, shipped from Sydney, Los Angeles and London. Our promise is simple: your hair, transformed. You are the voice of that promise on every ticket." },
          { t: "kv", pairs: [
            ["Smooth Serum — $79", "Frizz and flyaways. Silky cream-serum for damp hair, mid-lengths to ends."],
            ["Repair Serum — $85", "Damage and colour-treated hair. Bond-repair peptides; strength shows at 4-6 weeks."],
            ["Scalp Serum — $89", "Scalp health. The peppermint tingle is expected — it's the actives working, not a reaction."],
            ["Glow Serum — $75", "Shine. Weightless finishing oil, instant gloss."],
            ["The Hair Edit — $89/month", "Curated serum pairing by hair profile. Ships the 15th; swaps close on the 12th."],
          ]},
          { t: "warn", v: "Two facts prevent most refunds: results take 4-6 weeks of consistent use, and the Scalp Serum tingle is a feature. Educate first, always." },
          { t: "tip", v: "Voice check before every send: warm, knowledgeable, confident. Never clinical, never preachy. We solve — we don't apologise unnecessarily." },
          { t: "scenario", customer: "Just started the Scalp Serum and my scalp tingles for a few minutes after. Is that meant to happen?", hint: "Reassure with the science, keep the door open for anything beyond a tingle.", response: "Yes — and it's actually a good sign. That gentle tingle is the peppermint and actives getting to work on your scalp; it settles within a few minutes and eases off as your scalp adjusts over the first week or two. If it ever tips into burning, itching, or irritation, stop use and tell me straight away and we'll sort it together. Warmly, [Name] — LUMÉ" },
          { t: "summary", items: ["Four serums + The Hair Edit — know prices and pairings cold", "Results at 4-6 weeks; tingle is expected", "Voice: warm, knowledgeable, confident", "Sign-off: Warmly, [Name] — LUMÉ"] },
        ],
        check: [
          { q: "The Scalp Serum tingle is:", options: ["An adverse reaction", "Expected — the actives working", "A sign to stop use", "A packaging fault"], correct: 1, exp: "Expected and temporary. Pain or a rash is different — that's a Reaction/Concern log." },
          { q: "When do results show?", options: ["First wash", "4-6 weeks", "3 days", "6 months"], correct: 1, exp: "4-6 weeks of consistent use — the anchor for every 'no results yet' conversation." },
        ],
      },
    ],
    quiz: [
      { q: "What ships on the 15th of every month?", options: ["All serum orders", "The Hair Edit box", "Replacement orders", "Nothing — shipping is daily"], correct: 1, exp: "The Hair Edit ships the 15th; swap requests close on the 12th." },
      { q: "Which serum is the finisher for all hair profiles?", options: ["Smooth", "Repair", "Scalp", "Glow"], correct: 3, exp: "Glow Serum is the universal finisher — instant shine on dry hair." },
      { q: "The correct sign-off is:", options: ["Warmly, [Name] — LUMÉ", "Regards, LUMÉ CX", "With love, LUMÉ", "Cheers, [Name]"], correct: 0, exp: "Warmly, [first name] — LUMÉ. Every reply." },
    ],
    writing: {
      scenario: "Hi, I started the Repair Serum about three weeks ago and I honestly can't see any difference yet. My hair is still snapping when I brush it. Should I just give up?",
      prompt: "You are a LUMÉ CX quality coach reviewing a trainee reply. Customer message: [CUSTOMER]. Trainee response: [RESPONSE]. Check: (1) warm acknowledgement without over-apologising, (2) 4-6 week timeline education, (3) a routine check (damp hair, ends first), (4) confidence and an open door — no premature refund offer. Grade against the QC rubric (Tone 25, Policy accuracy 25, Resolution completeness 25, Proactivity 25). Start with SCORE: X/100 on its own line, then 3-4 sentences on what worked and the single biggest improvement." },
  },
  {
    day: 2, title: "Week 2 — The Playbook",
    subtitle: "Policies, edge cases, and knowing when to escalate", duration: "2-3 hrs",
    lessons: [
      {
        id: "d2l0", title: "Policy edge cases",
        content: [
          { t: "h", v: "The 30-day guarantee and its edges" },
          { t: "p", v: "30 days from delivery, opened or unopened. Inside the window: refund without friction. Outside it: educate first, then store credit at your discretion — cash refunds outside 30 days escalate to a Lead." },
          { t: "kv", pairs: [
            ["Lost package", "Confirm address → neighbours/safe spots → 24h wait → free replacement. Log it for the Parcelline claim."],
            ["Damaged arrival", "Photo evidence → free replacement, no return. Gift orders get gift-ready packaging and a handwritten note."],
            ["Reaction / concern", "Verbatim record, refund, escalate within 1 hour. Compliance record — thoroughness is the feature."],
            ["Chargeback threat", "Stay calm, never match the energy. Resolve the underlying issue on policy; a threat doesn't change the answer."],
          ]},
          { t: "rule", v: "One save attempt per cancellation. Reactions and medical concerns get zero save attempts — cancel and care." },
          { t: "compare", pairs: [
            ["Unfortunately our policy states that we cannot refund after 30 days.", "You're just outside our 30-day window, so here's what I can do instead — store credit toward your next box, applied right now."],
            ["Sorry for the inconvenience caused.", "That box should have arrived looking perfect — here's how I'm fixing it today."],
          ]},
        ],
        check: [
          { q: "Refund request at day 45. You:", options: ["Refuse outright", "Educate, then offer store credit; cash refund needs a Lead", "Refund in full", "Ignore the date"], correct: 1, exp: "Outside 30 days: education + store credit at your discretion; cash escalates to a Lead." },
          { q: "How many save attempts on an adverse-reaction cancellation?", options: ["One", "Two", "Zero", "Three"], correct: 2, exp: "Zero. Reactions cancel with care, never a pitch." },
        ],
      },
    ],
    quiz: [
      { q: "The guarantee window runs from:", options: ["Order date", "Delivery date", "Dispatch date", "First use"], correct: 1, exp: "30 days from delivery." },
      { q: "Damaged product resolution requires:", options: ["Return shipping", "Photo evidence, then free replacement", "Manager approval", "Store credit only"], correct: 1, exp: "Photo first, replacement free, no return needed." },
      { q: "A reaction report must be escalated within:", options: ["24 hours", "1 hour", "1 week", "Same shift"], correct: 1, exp: "One hour. It's a compliance clock, not a service target." },
    ],
    writing: {
      scenario: "My order says delivered but there's nothing here. I've looked everywhere. This is the second time a parcel has gone missing on your courier. Fix it.",
      prompt: "You are a LUMÉ CX quality coach reviewing a trainee reply. Customer message: [CUSTOMER]. Trainee response: [RESPONSE]. Check: (1) calm ownership without blaming the courier, (2) the lost-package flow (address confirm, safe spots, 24h, replacement), (3) acknowledges the repeat frustration, (4) logs for the Parcelline claim. Grade against the QC rubric (Tone 25, Policy 25, Resolution 25, Proactivity 25). Start with SCORE: X/100, then 3-4 sentences." },
  },
  {
    day: 3, title: "Week 3 — Scenario Library",
    subtitle: "Graded practice against the QC rubric", duration: "3-4 hrs",
    lessons: [
      {
        id: "d3l0", title: "How you're scored",
        content: [
          { t: "h", v: "The QC rubric — 100 points" },
          { t: "kv", pairs: [
            ["Tone & voice — 25", "Warm, confident, on-brand. No corporate filler, no over-apologising."],
            ["Policy accuracy — 25", "Right policy, right numbers, right escalation path."],
            ["Resolution completeness — 25", "The customer's actual problem is solved, not just answered."],
            ["Proactivity / save attempt — 25", "Root cause addressed; one genuine save where appropriate."],
          ]},
          { t: "rule", v: "Pass mark is 80. Run the Simulate tab scenarios until your coach scores stop dipping below it." },
          { t: "tip", v: "The highest-scoring replies always open with the customer's situation, never with the policy." },
        ],
        check: [
          { q: "Pass mark on the QC rubric:", options: ["70", "75", "80", "90"], correct: 2, exp: "80 out of 100, weighted evenly across the four categories." },
          { q: "High-scoring replies open with:", options: ["The policy", "The customer's situation", "An apology", "A discount"], correct: 1, exp: "Acknowledge first; policy comes second." },
        ],
      },
    ],
    quiz: [
      { q: "The four rubric categories are:", options: ["Speed, tone, grammar, upsells", "Tone, policy accuracy, resolution completeness, proactivity", "CSAT, NPS, QC, saves", "Empathy, apology, refund, close"], correct: 1, exp: "Tone 25 · Policy 25 · Resolution 25 · Proactivity 25." },
      { q: "Where do you practise the scenario library?", options: ["Live tickets", "The Simulate tab", "Slack", "Email drafts"], correct: 1, exp: "Simulate runs the ten scenarios with an AI customer and coach feedback." },
      { q: "A save attempt is worth points when it:", options: ["Happens on every ticket", "Addresses the root cause once, genuinely", "Offers the biggest discount", "Delays the cancellation"], correct: 1, exp: "One genuine, root-cause save. Pressure scores zero." },
    ],
    writing: {
      scenario: "My Hair Edit box came with the wrong serums AGAIN. My profile says coily hair. If this is what a 'curated' box looks like I'd rather just cancel the whole thing.",
      prompt: "You are a LUMÉ CX quality coach reviewing a trainee reply. Customer message: [CUSTOMER]. Trainee response: [RESPONSE]. Check: (1) owns the curation miss without excuses, (2) fixes the box (correct serums out now), (3) one genuine save addressing the root cause (profile audit + next-box guarantee), (4) respectful exit if declined. Grade against the QC rubric (Tone 25, Policy 25, Resolution 25, Proactivity 25). Start with SCORE: X/100, then 3-4 sentences." },
  },
  {
    day: 4, title: "Week 4 — Live with Training Wheels",
    subtitle: "Supervised tickets, capstone, and promotion to Agent", duration: "Full week",
    lessons: [
      {
        id: "d4l0", title: "Going live",
        content: [
          { t: "h", v: "Your first live week" },
          { t: "p", v: "You take real tickets with a Lead reviewing every send before it goes out. By Thursday the training wheels loosen — standard tickets go out unreviewed, edge cases still get a second pair of eyes." },
          { t: "list", items: [
            "Log everything — issues, replacements, feedback — in under 30 seconds per entry",
            "Ask LUMÉ before you ask a human; bring the answer to your Lead to confirm, not the question",
            "Escalations: reactions within the hour, refunds outside 30 days to a Lead, anything legal to a Manager",
          ]},
          { t: "warn", v: "The capstone: a full shift at QC 80+, logged cleanly, with at least one genuine save attempt. Pass it and you're promoted to Agent automatically." },
        ],
        check: [
          { q: "Thursday of live week, standard tickets are:", options: ["Still fully reviewed", "Sent unreviewed; edge cases still reviewed", "Handled by your Lead", "Paused"], correct: 1, exp: "Training wheels loosen mid-week — standard traffic flows, edge cases stay supervised." },
          { q: "The capstone requires:", options: ["50 tickets in a day", "A full shift at QC 80+ with clean logging and a genuine save attempt", "Zero escalations", "A written exam"], correct: 1, exp: "Quality over volume: QC 80+, clean logs, one real save." },
        ],
      },
    ],
    quiz: [
      { q: "Every log entry should take:", options: ["Under 30 seconds", "2-3 minutes", "5 minutes", "As long as needed"], correct: 0, exp: "The hub is built for sub-30-second logging — keyboard first." },
      { q: "Passing the capstone means:", options: ["Another month of review", "Automatic promotion to Agent", "A pay review", "Moving to the Ops team"], correct: 1, exp: "Capstone pass → Agent, automatically." },
      { q: "Before asking a Lead a policy question, you should:", options: ["Guess", "Check Ask LUMÉ and bring the answer to confirm", "Skip the ticket", "Email the customer to wait"], correct: 1, exp: "Ask LUMÉ first — bring answers to confirm, not questions to outsource." },
    ],
    writing: {
      scenario: "I want to cancel. Money's tight this month and $89 is a lot. I do love the products though, this isn't about quality.",
      prompt: "You are a LUMÉ CX quality coach reviewing a trainee reply. Customer message: [CUSTOMER]. Trainee response: [RESPONSE]. This is a price-driven cancellation from a happy customer. Check: (1) genuine empathy for the budget squeeze, (2) one save attempt matched to the root cause (skip a month / bi-monthly / pause — not a discount reflex), (3) respectful immediate cancellation if declined, (4) warm exit that leaves the door open. Grade against the QC rubric (Tone 25, Policy 25, Resolution 25, Proactivity 25). Start with SCORE: X/100, then 3-4 sentences." },
  },
];

// ─── AI Helper ────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, messages, maxTokens = 600) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, messages, maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.text;
}

// ─── System Prompts ───────────────────────────────────────────────────────────
// Ticket-handling answers come back structured so the panel can render
// Quick Decision / Suggested Reply / If They Push Back as distinct cards
// (and the copy button can grab only the customer-facing draft).
const ASK_FORMAT = [
  "OUTPUT FORMAT — when the question is about handling a live ticket or customer situation, structure the answer with exactly these markdown headings, in this order:",
  "### QUICK DECISION",
  "one or two sentences — the call to make, immediately actionable.",
  "### SUGGESTED REPLY",
  "the complete customer-facing draft in the LUMÉ voice, sign-off included. Nothing under this heading except the draft itself.",
  "### IF THEY PUSH BACK",
  "the fallback position — what can flex, what stays firm.",
  "For purely informational questions (facts, policy lookups, product details) answer normally without the headings.",
].join(" ");
const ASK_SYSTEM = buildAskLumaSystem() + " " + ASK_FORMAT;

// Split a structured Ask LUMÉ answer into its cards. Returns null when
// the reply has no section headings (informational answers).
function parseAskSections(content) {
  const re = /^###\s*(QUICK DECISION|SUGGESTED REPLY|IF THEY PUSH BACK)\s*$/gim;
  const parts = [];
  let match, last = null;
  while ((match = re.exec(content)) !== null) {
    if (last) parts.push({ key: last.key, body: content.slice(last.end, match.index).trim() });
    last = { key: match[1].toUpperCase(), end: match.index + match[0].length };
  }
  if (!last) return null;
  parts.push({ key: last.key, body: content.slice(last.end).trim() });
  const intro = content.slice(0, content.search(re.source ? /^###\s*(QUICK DECISION|SUGGESTED REPLY|IF THEY PUSH BACK)\s*$/im : 0)).trim();
  return { intro, sections: parts };
}

const SIM_CUSTOMER_SYSTEM = [
  "You are a customer of LUMÉ, a premium haircare brand (serums + The Hair Edit subscription box). Stay in character. Be realistic and skeptical but not abusive.",
  "Keep responses to 1-2 sentences.",
  "If the agent gives an excellent answer that fully addresses your concern, soften or express satisfaction.",
].join(" ");

const SIM_COACH_SYSTEM = [
  "You are a LUMÉ CX training coach reviewing an agent-in-training's responses.",
  "Give 2-3 sentences of specific, actionable feedback.",
  "Reference actual LUMÉ products (Smooth $79, Repair $85, Scalp $89, Glow $75, The Hair Edit $89/month), policies (30-day guarantee from delivery, 4-6 week results timeline, one save attempt max), or voice guidelines (warm, knowledgeable, confident — sign-off 'Warmly, [Name] — LUMÉ').",
  "Always mention one thing done well and one concrete improvement.",
  "Be encouraging but honest.",
].join(" ");

// ─── Utility ──────────────────────────────────────────────────────────────────
function diffColor(d) {
  if (d === "Easy")   return "#2a7a2a";
  if (d === "Medium") return GOLD;
  return RED;
}

function cellStyle(val, isDiscontinued) {
  const base = {
    fontFamily: F.sans, fontSize: 13,
    padding: "8px 12px", borderBottom: "1px solid #eee",
  };
  if (isDiscontinued) base.opacity = 0.5;
  if (!val || val === "—") return { ...base, color: "#ccc" };
  if (val.startsWith("$")) return { ...base, color: GOLD, fontWeight: "700" };
  return base;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App({ userId, role, displayName }) {
  // ── "View as" preview override (Cherie May 21, for Loom recordings) ──
  // Owner/Admin/Manager can temporarily render the hub as if they were
  // any lower-rank role — e.g. "View as Agent" before recording a
  // training video. Purely presentational; API role gates still see
  // the real Clerk role, so no actions break. Persisted in localStorage
  // so a refresh doesn't kick you out mid-recording. A banner appears
  // at the top while the override is active so you can't forget to reset.
  const [viewAsRole, setViewAsRole] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("luma_view_as_role");
      if (stored) setViewAsRole(stored);
    } catch { /* ignore localStorage errors */ }
  }, []);
  function updateViewAsRole(next) {
    setViewAsRole(next);
    try {
      if (next) window.localStorage.setItem("luma_view_as_role", next);
      else window.localStorage.removeItem("luma_view_as_role");
    } catch { /* ignore */ }
  }
  // Only allow overrides to roles strictly LOWER than the actual role —
  // no escalation from this UI.
  const canPreviewAs = role && ["Manager", "Admin", "Owner"].includes(role);
  const effectiveRole = viewAsRole || role;

  const [tab, setTab] = useState(effectiveRole === "Ops" ? "Logs" : "Home");

  // Role preview gates page content: if the current tab isn't accessible
  // to the effective (previewed) role, bounce to Home (Ops lands on Logs,
  // its home base). Without this, switching "View as" while on a gated
  // page left the gated content mounted with only the tab button hidden.
  useEffect(() => {
    if (!canAccessTab(tab, effectiveRole)) {
      setTab(effectiveRole === "Ops" ? "Logs" : "Home");
    }
  }, [tab, effectiveRole]);

  // Deep-link from email: parse #records:issues style hashes on mount and
  // jump straight to the right tab. RecordsTab reads the same hash to set
  // its sub-tab. We only read on mount — navigating around the app
  // doesn't push to URL, so the hash bar stays clean once you're in.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return;
    const tabPart = hash.split(":")[0];
    const valid = ["Home", "Insights", "Reports", "Logs", "Records", "Playbook", "Affiliates", "Ask LUMÉ", "Training", "Quiz", "Progress"];
    const matched = valid.find((v) => v.toLowerCase() === tabPart.toLowerCase());
    if (matched) setTab(matched);
  }, []);

  // Player
  const [playerName, setPlayerName] = useState("");
  const [nameInput,  setNameInput]  = useState("");
  const [showName,   setShowName]   = useState(false);
  const [showLB,     setShowLB]     = useState(false);

  // Quiz
  const [selMod,        setSelMod]        = useState(null);
  const [qIdx,          setQIdx]          = useState(0);
  const [chosen,        setChosen]        = useState(null);
  const [answers,       setAnswers]       = useState([]);
  const [totalScore,    setTotalScore]    = useState(0);
  const [completed,     setCompleted]     = useState([]);
  const [sessionScores, setSessionScores] = useState({});

  // Ask LUMÉ
  const [chatMsgs,    setChatMsgs]    = useState([{ role:"assistant", content:"Policy, tricky tickets, what to write back — ask me anything. I'm your LUMÉ HAIR guide." }]);
  const [chatInput,   setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [askOpen, setAskOpen] = useState(false);

  // Command palette (Cmd+K / Ctrl+K)
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [logsSubRequest, setLogsSubRequest] = useState(null);
  const [playbookQueryRequest, setPlaybookQueryRequest] = useState(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function openAskWith(prefill) {
    if (typeof prefill === "string" && prefill) setChatInput(prefill);
    setAskOpen(true);
  }

  // Simulate
  const [selScen,     setSelScen]     = useState(null);
  const [simMsgs,     setSimMsgs]     = useState([]);
  const [simInput,    setSimInput]    = useState("");
  const [simLoading,  setSimLoading]  = useState(false);
  const [simFeedback, setSimFeedback] = useState("");
  const [simDone,     setSimDone]     = useState(false);
  const [agentTurns,  setAgentTurns]  = useState(0);
  const simEndRef = useRef(null);

  // Bootcamp
  const [bcProgress,      setBcProgress]      = useState(() => { try { return JSON.parse(localStorage.getItem(BC_KEY) || "{}"); } catch(e) { return {}; } });
  const [bcView,          setBcView]          = useState("overview"); // overview | day | lesson | check | quiz | writing | graduation
  const [bcDay,           setBcDay]           = useState(null);
  const [bcLesson,        setBcLesson]        = useState(null);
  const [bcQIdx,          setBcQIdx]          = useState(0);
  const [bcChosen,        setBcChosen]        = useState(null);
  const [bcAnswers,       setBcAnswers]       = useState([]);
  const [bcWriteInput,    setBcWriteInput]    = useState("");
  const [bcWriteFeedback, setBcWriteFeedback] = useState("");
  const [bcWriteLoading,  setBcWriteLoading]  = useState(false);
  const [bcWriteDone,     setBcWriteDone]     = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const lb = JSON.parse(localStorage.getItem(LB_KEY) || "[]");
      setLeaderboard(lb);
    } catch(e) {}
    try {
      const saved = JSON.parse(localStorage.getItem("luma_cx_state") || "{}");
      if (saved.playerName)    setPlayerName(saved.playerName);
      if (saved.totalScore !== undefined) setTotalScore(saved.totalScore);
      if (saved.completed)     setCompleted(saved.completed);
      if (saved.sessionScores) setSessionScores(saved.sessionScores);
    } catch(e) {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem("luma_cx_state", JSON.stringify({ playerName, totalScore, completed, sessionScores }));
    } catch(e) {}
  }, [playerName, totalScore, completed, sessionScores]);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs]);
  useEffect(() => { simEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [simMsgs, simFeedback]);

  // ── Leaderboard save ──────────────────────────────────────────────────────
  function saveLB(name, score, mods) {
    try {
      const lb = JSON.parse(localStorage.getItem(LB_KEY) || "[]");
      const idx = lb.findIndex(e => e.name === name);
      const entry = { name, score, mods };
      if (idx >= 0) lb[idx] = entry;
      else lb.push(entry);
      lb.sort((a,b) => b.score - a.score);
      const top = lb.slice(0,20);
      localStorage.setItem(LB_KEY, JSON.stringify(top));
      setLeaderboard(top);
    } catch(e) {}
  }

  // ── Quiz Logic ────────────────────────────────────────────────────────────
  function startMod(idx) {
    setSelMod(idx);
    setQIdx(0);
    setChosen(null);
    setAnswers([]);
  }

  function pickAnswer(i) {
    if (chosen !== null) return;
    setChosen(i);
    setAnswers(prev => [...prev, { chosen: i, correct: MODULES[selMod].questions[qIdx].correct }]);
  }

  function nextQ() {
    const mod = MODULES[selMod];
    if (qIdx + 1 < mod.questions.length) {
      setQIdx(q => q + 1);
      setChosen(null);
    } else {
      finishMod();
    }
  }

  function finishMod() {
    const mod = MODULES[selMod];
    const allAnswers = [...answers];
    const finalScore = allAnswers.filter(a => a.chosen === a.correct).length;

    const newSession  = { ...sessionScores, [mod.id]: finalScore };
    const newCompleted = completed.includes(mod.id) ? completed : [...completed, mod.id];
    const newTotal    = Object.values(newSession).reduce((s,v) => s+v, 0);

    setSessionScores(newSession);
    setCompleted(newCompleted);
    setTotalScore(newTotal);
    if (playerName) saveLB(playerName, newTotal, newCompleted.length);

    setSelMod(null);
    setQIdx(0);
    setChosen(null);
    setAnswers([]);
  }

  // ── Ask LUMÉ Logic ────────────────────────────────────────────────────────
  async function sendChat(textOverride) {
    const text = (typeof textOverride === "string" ? textOverride : chatInput).trim();
    if (!text || chatLoading) return;
    const userMsg = { role:"user", content: text };
    const newMsgs = [...chatMsgs, userMsg];
    setChatMsgs(newMsgs);
    setChatInput("");
    setChatLoading(true);
    try {
      const history = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(ASK_SYSTEM, history);
      setChatMsgs(prev => [...prev, { role:"assistant", content: reply }]);
    } catch(e) {
      setChatMsgs(prev => [...prev, { role:"assistant", content: "Error: " + e.message }]);
    }
    setChatLoading(false);
  }

  // ── Simulate Logic ────────────────────────────────────────────────────────
  function startScen(scen) {
    setSelScen(scen);
    setSimMsgs([{ role:"customer", content: scen.customerMsg }]);
    setSimInput("");
    setSimFeedback("");
    setSimDone(false);
    setAgentTurns(0);
  }

  async function sendSim() {
    if (!simInput.trim() || simLoading || simDone) return;
    const agentMsg = { role:"agent", content: simInput.trim() };
    const newMsgs  = [...simMsgs, agentMsg];
    setSimMsgs(newMsgs);
    setSimInput("");
    setSimLoading(true);
    const newTurns = agentTurns + 1;
    setAgentTurns(newTurns);

    try {
      const custHistory = newMsgs.map(m => ({
        role: m.role === "agent" ? "user" : "assistant",
        content: m.content
      }));
      const custReply = await callClaude(
        SIM_CUSTOMER_SYSTEM + " Scenario: " + selScen.customerMsg,
        custHistory
      );
      const withCust = [...newMsgs, { role:"customer", content: custReply }];
      setSimMsgs(withCust);

      if (newTurns >= 2) {
        const transcript = withCust.map(m => m.role.toUpperCase() + ": " + m.content).join("\n");
        const coachReply = await callClaude(
          SIM_COACH_SYSTEM,
          [{ role:"user", content: "Review this CS training simulation:\n" + transcript }]
        );
        setSimFeedback(coachReply);
        setSimDone(true);
      }
    } catch(e) {
      setSimMsgs(prev => [...prev, { role:"customer", content: "Error: " + e.message }]);
    }
    setSimLoading(false);
  }

  // ── Bootcamp Progress Save ────────────────────────────────────────────────
  function saveBcProgress(updated) {
    setBcProgress(updated);
    try { localStorage.setItem(BC_KEY, JSON.stringify(updated)); } catch(e) {}
  }

  async function submitWritingExercise() {
    if (!bcWriteInput.trim() || bcWriteLoading) return;
    setBcWriteLoading(true);
    const dayData = BOOTCAMP_DAYS[bcDay - 1];
    const sysPrompt = dayData.writing.prompt
      .replace("[CUSTOMER]", dayData.writing.scenario)
      .replace("[RESPONSE]", bcWriteInput.trim());
    try {
      const fb = await callClaude(sysPrompt, [{ role:"user", content:"Please evaluate this response now." }]);
      setBcWriteFeedback(fb);
      setBcWriteDone(true);
      const updated = { ...bcProgress, [bcDay]: { ...(bcProgress[bcDay] || {}), writingDone: true } };
      saveBcProgress(updated);
    } catch(e) {
      setBcWriteFeedback("Error: " + e.message);
    }
    setBcWriteLoading(false);
  }

  // ── Save Name ─────────────────────────────────────────────────────────────
  function saveName() {
    if (!nameInput.trim()) return;
    const n = nameInput.trim();
    setPlayerName(n);
    setShowName(false);
    setNameInput("");
    saveLB(n, totalScore, completed.length);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F.sans, background: CREAM, minHeight: "100vh" }}>
      {/* Global polish: visible focus rings for keyboard users, the
          150ms tab-switch transition, and the 390px responsive rules. */}
      <style>{`
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, [role=combobox]:focus-visible {
          outline: 2px solid ${GOLD}; outline-offset: 2px; border-radius: 6px;
        }
        @keyframes luma-tab-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .luma-tab-fade { animation: luma-tab-fade 150ms ease-out; }
        .luma-mobile-only { display: none; }
        @media (max-width: 640px) {
          .luma-form-grid { grid-template-columns: 1fr !important; }
          .luma-hide-mobile { display: none !important; }
          .luma-mobile-only { display: inline-flex; }
          /* Bar rows (Impact breakdown, HBarList): label + value on the
             first line, the bar full-width underneath — nothing clips. */
          .luma-bar-row { grid-template-columns: minmax(0, 1fr) auto !important; row-gap: 5px !important; }
          .luma-bar-row > .luma-bar-label { grid-column: 1 !important; grid-row: 1; }
          .luma-bar-row > .luma-bar-value { grid-column: 2 !important; grid-row: 1; }
          .luma-bar-row > .luma-bar-track { grid-column: 1 / -1 !important; grid-row: 2; }
          .luma-bar-detail { display: none !important; }
        }
      `}</style>

      {/* "View as" preview banner — sticky above the header so it's
          impossible to forget you're in preview mode while recording. */}
      {viewAsRole && (
        <div style={{
          background: RED, color: W,
          padding: "8px 24px",
          fontFamily: F.sans, fontSize: 12, fontWeight: 700, letterSpacing: 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 101,
        }}>
          <span>👁  Preview mode — viewing as <strong>{viewAsRole}</strong> (your real role is {role}). Permissions unchanged.</span>
          <button
            onClick={() => updateViewAsRole(null)}
            style={{
              background: W, color: RED,
              border: "none",
              fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              padding: "4px 10px", borderRadius: 4, cursor: "pointer",
            }}
          >
            Reset to my role
          </button>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div id="luma-app-header" style={{ background: W, position: "sticky", top: viewAsRole ? 36 : 0, zIndex: 100, borderBottom: "1px solid #DDD8CE" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="" width={22} height={22} style={{ display: "block" }} />
            <div>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 16, color: BURG, letterSpacing: 3 }}>LUMÉ HAIR</div>
              <div style={{ fontFamily: F.sans, fontSize: 8, color: GOLD, opacity: 0.9, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700 }}>CX Hub</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* "View as" preview selector — Manager/Admin/Owner only.
                Lets Cherie record a Loom from the Agent perspective. */}
            {canPreviewAs && (
              <Combobox
                value={viewAsRole || ""}
                onChange={(v) => updateViewAsRole(v || null)}
                title="Preview the hub as if you were this role. Purely visual — your real permissions are unchanged."
                options={[
                  { value: "", label: "View as: my role" },
                  { value: "New Starter", label: "View as: New Starter" },
                  { value: "Agent", label: "View as: Agent" },
                  { value: "Ops", label: "View as: Ops" },
                  { value: "Lead Agent", label: "View as: Lead Agent" },
                  { value: "Manager", label: "View as: Manager" },
                  ...(role === "Owner" ? [{ value: "Admin", label: "View as: Admin" }] : []),
                ]}
                panelWidth={210}
                style={{
                  width: 180,
                  fontFamily: F.sans, fontSize: 10, fontWeight: 700,
                  letterSpacing: 1.5, textTransform: "uppercase",
                  padding: "5px 12px",
                  border: "1px solid " + (viewAsRole ? RED : SOFT_BORDER),
                  background: viewAsRole ? "#fee" : W,
                  color: viewAsRole ? RED : INK,
                  borderRadius: 99,
                }}
              />
            )}
            <button
              onClick={() => setPaletteOpen(true)}
              title="Search & commands (⌘K)"
              style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: INK, fontFamily: F.sans, fontSize: 11, padding: "5px 12px", borderRadius: 99, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span aria-hidden="true" style={{ color: GOLD }}>⌕</span>
              <span className="luma-hide-mobile" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, opacity: 0.55 }}>⌘K</span>
            </button>
            {effectiveRole && (
              <span className="luma-hide-mobile" style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, padding: "4px 10px", border: "1px solid " + GOLD, borderRadius: 99 }}>{effectiveRole}</span>
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 16px" }}>
          {TABS.filter(t => canAccessTab(t, effectiveRole)).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "transparent", border: "none", borderBottom: tab === t ? "2px solid " + BURG : "2px solid transparent", color: tab === t ? BURG : "rgba(10,10,9,0.38)", fontFamily: F.sans, fontSize: 12, fontWeight: tab === t ? 700 : 500, padding: "12px 16px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", letterSpacing: 1 }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div key={tab} className="luma-tab-fade">
      {tab === "Home"     && <HomeTab     displayName={displayName} setTab={setTab} role={effectiveRole} openAsk={openAskWith} />}
      {tab === "Insights" && <InsightsTab role={effectiveRole} />}
      {tab === "Logs"     && <LogsTab role={effectiveRole} subRequest={logsSubRequest} setTab={setTab} />}
      {tab === "Reports"  && <ReportsTab role={effectiveRole} />}
      {tab === "Records"  && <RecordsTab role={effectiveRole} />}
      {tab === "Playbook"   && <PlaybookTab   role={effectiveRole} queryRequest={playbookQueryRequest} />}
      {tab === "Team"       && <TeamTab       role={effectiveRole} />}
      {tab === "Training" && <TrainingTab
        role={effectiveRole}
        bcProgress={bcProgress} saveBcProgress={saveBcProgress} bcView={bcView} setBcView={setBcView}
        bcDay={bcDay} setBcDay={setBcDay} bcLesson={bcLesson} setBcLesson={setBcLesson}
        bcQIdx={bcQIdx} setBcQIdx={setBcQIdx} bcChosen={bcChosen} setBcChosen={setBcChosen}
        bcAnswers={bcAnswers} setBcAnswers={setBcAnswers}
        bcWriteInput={bcWriteInput} setBcWriteInput={setBcWriteInput}
        bcWriteFeedback={bcWriteFeedback} bcWriteLoading={bcWriteLoading}
        bcWriteDone={bcWriteDone} setBcWriteDone={setBcWriteDone}
        setBcWriteFeedback={setBcWriteFeedback} submitWritingExercise={submitWritingExercise}
        playerName={playerName}
        selMod={selMod} setSelMod={setSelMod} qIdx={qIdx} chosen={chosen} answers={answers}
        sessionScores={sessionScores} completed={completed} startMod={startMod}
        pickAnswer={pickAnswer} nextQ={nextQ} finishMod={finishMod}
        selScen={selScen} setSelScen={setSelScen} simMsgs={simMsgs} simInput={simInput}
        setSimInput={setSimInput} simLoading={simLoading} simFeedback={simFeedback}
        simDone={simDone} sendSim={sendSim} startScen={startScen} simEndRef={simEndRef}
        totalScore={totalScore} setTab={setTab}
      />}

      </div>

      {/* ── GLOBAL SURFACES — slide-over, palette, floating access, toasts ── */}
      <AskPanel
        open={askOpen}
        onClose={() => setAskOpen(false)}
        chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput}
        chatLoading={chatLoading} sendChat={sendChat} chatEndRef={chatEndRef}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        role={effectiveRole}
        setTab={setTab}
        requestLogsSub={(subName) => setLogsSubRequest({ sub: subName, nonce: Date.now() })}
        requestPlaybookQuery={(query) => setPlaybookQueryRequest({ query, nonce: Date.now() })}
        openAsk={openAskWith}
      />
      <FloatingAskButton onClick={() => setAskOpen(true)} hidden={askOpen} />
      <ToastHost />

      {/* ── LEADERBOARD MODAL ──────────────────────────────────────────── */}
      {showLB && (
        <div style={{ position: "fixed", inset: 0, background: CREAM, zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ background: HEADER_GRAD, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: W, fontWeight: 600 }}>Leaderboard</div>
            <button onClick={() => setShowLB(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: W, fontFamily: F.sans, fontSize: 13, padding: "6px 14px", borderRadius: 4, cursor: "pointer" }}>Close</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {leaderboard.length === 0 && (
              <div style={{ textAlign: "center", color: "#999", fontFamily: F.sans, marginTop: 40 }}>No scores yet. Complete a quiz to get on the board!</div>
            )}
            {leaderboard.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", background: e.name === playerName ? "rgba(164,0,17,0.08)" : W, border: e.name === playerName ? "2px solid " + RED : "1px solid #e0d9d0", borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: i < 3 ? GOLD : BURG, width: 36 }}>{"#" + (i + 1)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 15, color: BURG }}>{e.name}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: "#999" }}>{e.mods} {e.mods !== 1 ? "modules" : "module"} completed</div>
                </div>
                <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: GOLD }}>{e.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────
// ─── WELCOME / HOME DATA ──────────────────────────────────────────────────────

// Demo team — replace with client's team members for each deployment
// Two celebration dates are anchored relative to today (a birthday in
// 2 days, a work anniversary today) so the Home celebrations block is
// never empty, whenever the demo is opened.
const _birthdaySoon = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })();
const _anniversaryToday = (() => { const d = new Date(); const y = d.getFullYear() - 2; return new Date(y, d.getMonth(), d.getDate()); })();
const TEAM = [
  { name: "Maya Chen",     bMonth: 4,  bDay: 12, joinDate: _anniversaryToday,      location: "Sydney",    title: "CX Manager" },
  { name: "Jordan Park",   bMonth: _birthdaySoon.getMonth() + 1, bDay: _birthdaySoon.getDate(), joinDate: new Date(2023, 5, 1), location: "Sydney", title: "Senior CX Specialist" },
  { name: "Priya Sharma",  bMonth: 2,  bDay: 27, joinDate: new Date(2024, 1, 10),  location: "Remote",    title: "CX Specialist" },
  { name: "Aisha Williams",bMonth: 6,  bDay: 19, joinDate: new Date(2024, 6, 15),  location: "Remote",    title: "CX Specialist" },
  { name: "Tom Nguyen",    bMonth: 11, bDay: 8,  joinDate: new Date(2025, 0, 20),  location: "Melbourne", title: "CX Specialist" },
  { name: "Sam Lee",       bMonth: 3,  bDay: 22, joinDate: new Date(2023, 8, 1),   location: "Sydney",    title: "Operations Coordinator" },
];

const QUOTES = [
  { text: "The customer's perception is your reality.", source: "Kate Zabriskie" },
  { text: "Customer service shouldn't just be a department, it should be the entire company.", source: "Tony Hsieh" },
  { text: "Your most unhappy customers are your greatest source of learning.", source: "Bill Gates" },
  { text: "We see our customers as invited guests to a party, and we are the hosts.", source: "Jeff Bezos" },
  { text: "The goal as a company is to have customer service that is not just the best but legendary.", source: "Sam Walton" },
  { text: "Revolve your world around the customer and more customers will revolve around you.", source: "Heather Williams" },
  { text: "It takes months to find a customer — seconds to lose one.", source: "Vince Lombardi" },
  { text: "Make every interaction count, even the small ones.", source: "Shep Hyken" },
  { text: "There is only one boss. The customer.", source: "Sam Walton" },
  { text: "A customer talking about their experience with you is worth ten times that which you write or say about yourself.", source: "David J. Greer" },
  { text: "Do what you do so well that they will want to see it again and bring their friends.", source: "Walt Disney" },
  { text: "The single most important thing is to make people happy.", source: "Derek Sivers" },
  { text: "Customers don't expect you to be perfect. They do expect you to fix things when they go wrong.", source: "Donald Porter" },
  { text: "Quality is remembered long after the price is forgotten.", source: "Gucci family slogan" },
  { text: "The secret is to work less as individuals and more as a team.", source: "Vince Lombardi" },
  { text: "Loyal customers, they don't just come back, they don't simply recommend you, they insist that their friends do business with you.", source: "Chip Bell" },
  { text: "People will forget what you said, people will forget what you did, but people will never forget how you made them feel.", source: "Maya Angelou" },
  { text: "The purpose of a business is to create a customer who creates customers.", source: "Shiv Singh" },
  { text: "Excellence is not a destination; it is a continuous journey that never ends.", source: "Brian Tracy" },
  { text: "Be genuinely interested in everyone you meet and everyone you meet will be genuinely interested in you.", source: "Rasheed Ogunlaru" },
  { text: "A brand is no longer what we tell the consumer it is — it is what consumers tell each other it is.", source: "Scott Cook" },
];

const GREETING_LINES = [
  "Let's make today count.",
  "Inbox waiting. Let's go.",
  "Ready when you are.",
  "One reply at a time.",
  "Let's keep the streak going.",
  "Your team is ready. Are you?",
  "Every ticket is a chance to build loyalty.",
  "Make every interaction count.",
];

const GREETING_LINES_MONDAY = [
  "Fresh week, fresh wins.",
  "New week. Let's own it.",
  "Hope you had a great weekend.",
];

const GREETING_LINES_FRIDAY = [
  "Strong finish to a strong week.",
  "Almost there — finish well.",
  "Last push before the weekend.",
  "End the week on a high.",
];

// Dates are relative so the marquee always reads as current.
const ANNOUNCEMENTS = [
  { title: "Scalp Serum tingling volume up this week — use SOP 01 for all queries", date: dateDaysAgo(0), dest: "Playbook" },
  { title: "Hair Edit swap deadline is the 12th — flag any requests coming in after", date: dateDaysAgo(1), dest: "Logs" },
  { title: "Failed payments up 18% — proactive outreach campaign launching Monday", date: dateDaysAgo(1), dest: "Insights" },
  { title: "Save rate hit 43% this week — great work team 🎉", date: dateDaysAgo(2), dest: "Insights" },
];

function pickByDay(list, today) {
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  return list[((dayOfYear % list.length) + list.length) % list.length];
}

// Picks an appropriate greeting tagline based on day-of-week, so we don't
// hit people with "Hope your weekend was top-tier" on a Thursday. Mondays
// get Monday-themed lines, Fridays get TGIF lines, everything else rotates
// through the day-agnostic pool.
function pickGreetingForDay(today) {
  const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  if (day === 1) return pickByDay(GREETING_LINES_MONDAY, today);
  if (day === 5) return pickByDay(GREETING_LINES_FRIDAY, today);
  return pickByDay(GREETING_LINES, today);
}

function greetingPrefix(hour) {
  if (hour < 5)  return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late night";
}

function announcementStatus(dateStr, today) {
  const d = new Date(dateStr);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d < t) return "live";
  if (d.getTime() === t.getTime()) return "today";
  return "upcoming";
}

function formatDateShort(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function eventsInWindow(team, today, days) {
  const events = [];
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i <= days; i++) {
    const day = new Date(start.getTime() + i * 86400000);
    const m = day.getMonth() + 1;
    const d = day.getDate();
    for (const p of team) {
      if (p.bMonth === m && p.bDay === d) {
        events.push({ type: "birthday", person: p, date: day, daysAway: i });
      }
      if (p.joinDate.getMonth() + 1 === m && p.joinDate.getDate() === d) {
        const years = day.getFullYear() - p.joinDate.getFullYear();
        if (years > 0) {
          events.push({ type: "anniversary", person: p, date: day, daysAway: i, years });
        }
      }
    }
  }
  return events;
}

function nextUpcomingEvents(team, today, n) {
  // Look up to a year ahead
  const all = eventsInWindow(team, today, 365);
  return all.filter((e) => e.daysAway > 0).slice(0, n);
}

function firstNameOf(fullName) {
  const parts = (fullName || "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  // Skip abbreviated honorifics like "Ma." → use next token
  if (parts[0].endsWith(".") && parts.length > 1) return parts[1];
  return parts[0];
}

const BLUSH = "#F0EBE0";
const PEACH = "#EDE5D8";
const SOFT_BORDER = "#DDD8CE";
const INK = "#0A0A09";

// Dark palette — used by home page announcement banner
const DARK_BG = "#0A0A09";
const DARK_CARD = "#161614";
const DARK_CARD_HI = "#1F1F1D";
const DARK_BORDER = "#2A2A28";
const CREAM_TXT = "#F4F0E8";
const WARM_GRAY = "#B0AAA2";

// ─── MODULE E — VALUE LEDGER ─────────────────────────────────────────────────
// The thesis productised: every action the Hub logs gets a dollar value,
// and the Hub keeps the receipt. ImpactHome is what Owners/Managers see
// first; LedgerView is the receipt file under Reports · Impact.

function formatLedgerMoney(v) {
  return "$" + Number(v).toLocaleString("en-AU", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

function HowWeCountPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid " + SOFT_BORDER, borderRadius: 12, background: W, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", background: "transparent", border: "none", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BURG }}>How we count</span>
        <span style={{ color: GOLD, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px" }}>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.7, lineHeight: 1.5, marginBottom: 14 }}>{LEDGER_STANCE}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: CREAM, color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Event</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>What we count</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700, whiteSpace: "nowrap" }}>Demo rate</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER_RATES.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? W : "#fdfbf9" }}>
                    <td style={{ padding: "9px 12px", color: BURG, fontWeight: 600, whiteSpace: "nowrap", verticalAlign: "top" }}>{r.event}</td>
                    <td style={{ padding: "9px 12px", color: INK, lineHeight: 1.5 }}>{r.counted}</td>
                    <td style={{ padding: "9px 12px", color: GOLD, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap", verticalAlign: "top" }}>{r.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactHome({ displayName, setTab, role, stats }) {
  const today = new Date();
  const firstName = (displayName?.trim()?.split(/\s+/)?.[0]) || "there";
  const L = LEDGER_SUMMARY;
  const maxBreak = Math.max(...L.breakdown.map((b) => b.value));
  const celebrationsToday = eventsInWindow(TEAM, today, 0);
  const upcoming = nextUpcomingEvents(TEAM, today, 2);
  const quickLinks = ["Insights", "Reports", "Records", "Logs", "Team"].filter((t) => canAccessTab(t, role));

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 96px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
          LUMÉ HAIR Hub · {greetingPrefix(today.getHours())}, {firstName}
        </div>

        {/* 1 — the money leads */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: "clamp(32px, 6.5vw, 52px)", color: BURG, fontWeight: 600, lineHeight: 1.08, letterSpacing: -1, maxWidth: 640 }}>
              The Hub returned <span style={{ color: GOLD }}>{formatLedgerMoney(L.monthTotal)}</span> this month.
            </div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 19, color: INK, opacity: 0.7, marginTop: 12 }}>
              against a {formatLedgerMoney(L.retainer)} retainer — <strong style={{ fontStyle: "normal", color: BURG }}>{L.multiple}× return</strong>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Sparkline data={L.trend} width={200} height={52} />
            <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>Last 6 months</div>
          </div>
        </div>

        {/* 2 — breakdown bars */}
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "22px 26px", margin: "26px 0 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {L.breakdown.map((b) => (
              <div key={b.key} className="luma-bar-row" style={{ display: "grid", gridTemplateColumns: "210px 1fr 190px", alignItems: "center", gap: 14 }}>
                <div className="luma-bar-label" style={{ fontFamily: F.sans, fontSize: 12.5, color: BURG, fontWeight: 600, gridColumn: 1 }}>
                  {b.label}
                  {b.key === "hours" && <span style={{ opacity: 0.55, fontWeight: 400 }}> · {L.hoursReclaimed}h</span>}
                </div>
                <div className="luma-bar-track" style={{ background: "#EFE9DF", borderRadius: 99, height: 8, overflow: "hidden", gridColumn: 2 }}>
                  <div style={{ background: GOLD, width: Math.max(3, Math.round((b.value / maxBreak) * 100)) + "%", height: "100%", borderRadius: 99 }} />
                </div>
                <div className="luma-bar-value" style={{ fontFamily: F.sans, fontSize: 12.5, textAlign: "right", whiteSpace: "nowrap", gridColumn: 3 }}>
                  <span style={{ color: BURG, fontWeight: 700 }}>{formatLedgerMoney(b.value)}</span>
                  <span className="luma-bar-detail" style={{ color: INK, opacity: 0.45, marginLeft: 8, fontSize: 11 }}>{b.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <HowWeCountPanel />

        {/* 3 — ops row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, margin: "26px 0" }}>
          <KpiTile label="Tickets" value={stats?.volume != null ? stats.volume.toLocaleString() : "—"} hint="this month" trend={DEMO_TREND.tickets} />
          <KpiTile label="CSAT" value={stats?.csat?.average != null ? stats.csat.average.toFixed(2) : "—"} hint={stats?.csat?.count ? `${stats.csat.count} responses` : null} trend={DEMO_TREND.csat} />
          <KpiTile label="Avg resolution" value={formatDuration(stats?.resolution?.avgSeconds)} hint={stats?.resolution?.count ? `${stats.resolution.count} closed` : null} trend={DEMO_TREND.resolution} />
        </div>

        {/* 4 — top action this month */}
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + GOLD, borderRadius: 12, padding: "20px 24px", marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", color: GOLD }}>Top action this month</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: BURG }}>{LEDGER_TOP_ACTION.value}</div>
          </div>
          <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600, margin: "8px 0 6px" }}>{LEDGER_TOP_ACTION.title}</div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.75, lineHeight: 1.6, maxWidth: 760 }}>{LEDGER_TOP_ACTION.detail}</div>
        </div>

        {/* 5 — compact celebrations strip + shortcuts */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", borderTop: "1px solid " + SOFT_BORDER, paddingTop: 18 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7 }}>
            {celebrationsToday.length > 0
              ? celebrationsToday.map((e) => e.type === "birthday" ? `🎉 ${firstNameOf(e.person.name)}'s birthday today` : `${firstNameOf(e.person.name)} — ${e.years} year${e.years === 1 ? "" : "s"} at LUMÉ today`).join(" · ")
              : "No celebrations today"}
            {upcoming.length > 0 && (
              <span style={{ opacity: 0.6 }}>
                {" · next: "}
                {upcoming.map((e) => `${firstNameOf(e.person.name)} ${e.type === "birthday" ? "birthday" : "anniversary"} ${formatDateShort(e.date)}`).join(", ")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {quickLinks.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "7px 14px", borderRadius: 99, cursor: "pointer" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reports · Recovery — what Parcelline owes, tracked to the dollar.
function RecoveryView() {
  const claims = claimsSeed();
  const byStatus = groupCount(claims, (r) => prettyEnum(r.status, CLAIM_STATUSES));
  const R = RECOVERY_STATS;
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 96px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Reports · Recovery</div>
        <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05 }}>3PL Recovery</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.65, margin: "8px 0 24px", maxWidth: 640 }}>{R.caption}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Recovered this quarter</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 700, color: BURG, lineHeight: 1 }}>{formatLedgerMoney(R.recoveredQuarter)}</div>
              <Sparkline data={R.monthlyTrend} width={72} height={24} />
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", marginTop: 6 }}>monthly trend</div>
          </div>
          <KpiTile label="Claims filed" value={R.claimsFiled} hint="this quarter" />
          <KpiTile label="Approval rate" value={`${Math.round(R.approvalRate * 100)}%`} hint="of submitted claims" />
          <KpiTile label="Days to reimbursement" value={R.avgDaysToReimbursement} hint="average, submission → paid" />
        </div>

        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 24, maxWidth: 560 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Open claims by status</div>
          <HBarList entries={byStatus} total={claims.length} labelWidth={210} />
        </div>

        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, lineHeight: 1.6, maxWidth: 640 }}>
          Claims are filed from Logs · 3PL Claim as issues come in, batch to Parcelline every Monday as CSV, and land here once reimbursed — every paid batch also posts to the Value Ledger.
        </div>
      </div>
    </div>
  );
}

// Reports · Voice of Customer V2 — the decision tool. Three actions with
// dollars attached, three wins, a watchlist, and one narrated paragraph.
function VoCView() {
  const [monthKey, setMonthKey] = useState("current");
  const [copied, setCopied] = useState(false);
  const M = VOC_MONTHS[monthKey];

  async function copyForExec() {
    const html = [
      `<h3>LUMÉ — Voice of Customer (${M.label.toLowerCase()})</h3>`,
      `<p><em>${VOC_WEIGHTING}</em></p>`,
      "<h4>Top 3 actions</h4>",
      "<ol>" + M.actions.map((a) => `<li><strong>${a.title}</strong> — ${a.signals} signals · ${a.impact}</li>`).join("") + "</ol>",
      "<h4>Wins</h4>",
      "<ul>" + M.wins.map((wv) => `<li>${wv.title} — ${wv.detail}</li>`).join("") + "</ul>",
      `<p>${M.summary}</p>`,
    ].join("");
    const plain = html.replace(/<[^>]+>/g, "");
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        })]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      notify("Copied for exec — paste straight into email or Slack");
    } catch {
      notify("Could not access the clipboard — try again");
    }
  }

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 96px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Reports · Voice of Customer</div>
            <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05 }}>What customers are telling us</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginTop: 8 }}>{VOC_WEIGHTING}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["current", "previous"].map((k) => (
              <button key={k} onClick={() => setMonthKey(k)} style={{ background: monthKey === k ? BURG : "transparent", color: monthKey === k ? CREAM : BURG, border: "1px solid " + (monthKey === k ? BURG : SOFT_BORDER), fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
                {VOC_MONTHS[k].label}
              </button>
            ))}
            <button onClick={copyForExec} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
              {copied ? "Copied" : "Copy for exec"}
            </button>
          </div>
        </div>

        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", margin: "26px 0 12px" }}>Top 3 actions — with dollars attached</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {M.actions.map((a, i) => (
            <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + GOLD, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: F.serif, fontSize: 26, color: GOLD, fontWeight: 600, lineHeight: 1 }}>{i + 1}</span>
                <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>{a.signals} signals</span>
              </div>
              <div style={{ fontFamily: F.serif, fontSize: 17, color: BURG, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: BURG, marginBottom: 8 }}>{a.impact}</div>
              <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, opacity: 0.7, lineHeight: 1.55 }}>{a.detail}</div>
            </div>
          ))}
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>Top 3 wins</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {M.wins.map((wv, i) => (
                <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <span style={{ fontFamily: F.serif, fontSize: 16, color: BURG, fontWeight: 600 }}>{wv.title}</span>
                  <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6 }}>{wv.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: "#A5544A", fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>Watchlist</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {M.watchlist.map((wl, i) => (
                <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid #A5544A", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, fontWeight: 700 }}>{wl.title}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.65, marginTop: 2, lineHeight: 1.5 }}>{wl.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 12, padding: "22px 26px", marginTop: 22 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>The read</div>
          <div style={{ fontFamily: F.serif, fontSize: 17, color: INK, lineHeight: 1.7, maxWidth: 820 }}>{M.summary}</div>
        </div>
      </div>
    </div>
  );
}

// Reports · Impact — the monthly ledger table. Filterable, exportable:
// the receipt file for renewal conversations.
function LedgerView() {
  const [rows] = useState(() => ledgerEntries());
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (r.reference + " " + r.detail).toLowerCase().includes(q);
    }
    return true;
  });
  const typeLabel = (t) => LEDGER_TYPES.find((x) => x.value === t)?.label ?? t;
  const filteredTotal = filtered.reduce((a, b) => a + b.value, 0);

  function downloadLedgerCSV() {
    const esc = (v) => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    const header = ["Date", "Event type", "Reference", "Detail", "Value (AUD)", "Running total (AUD)"].join(",");
    const body = [...filtered].reverse().map((r) => [
      new Date(r.date).toISOString().slice(0, 10),
      typeLabel(r.type), r.reference, r.detail,
      r.value.toFixed(2), r.runningTotal.toFixed(2),
    ].map(esc).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUME_value_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Value ledger exported — the receipt file");
  }

  const L = LEDGER_SUMMARY;
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 96px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Reports · Impact</div>
            <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05 }}>Value Ledger</div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.65, marginTop: 8, maxWidth: 640 }}>
              Every action the Hub logs, valued in dollars — {formatLedgerMoney(L.monthTotal)} this month against a {formatLedgerMoney(L.retainer)} retainer.
            </div>
          </div>
          <button onClick={downloadLedgerCSV} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            Download CSV
          </button>
        </div>

        <div style={{ margin: "18px 0" }}>
          <HowWeCountPanel />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ width: 220 }}>
            <Combobox
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: "", label: "All event types" }, ...LEDGER_TYPES]}
              style={{ padding: "8px 12px", fontSize: 12 }}
            />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference or detail…"
            style={{ flex: "1 1 240px", maxWidth: 360, padding: "9px 14px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, outline: "none" }}
          />
          <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginLeft: "auto" }}>
            {filtered.length} entries · {formatLedgerMoney(Math.round(filteredTotal))}
          </span>
        </div>

        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflow: "auto", maxHeight: "calc(100vh - 300px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12.5 }}>
            <thead>
              <tr>
                {["Date", "Event", "Reference", "Detail", "Value", "Running total"].map((h, i) => (
                  <th key={h} style={{ position: "sticky", top: 0, zIndex: 1, background: CREAM, padding: "10px 14px", textAlign: i >= 4 ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase", borderBottom: "1px solid " + SOFT_BORDER, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? W : "#fdfbf9" }}>
                  <td style={{ padding: "9px 14px", whiteSpace: "nowrap", color: INK, opacity: 0.75 }}>{new Date(r.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</td>
                  <td style={{ padding: "9px 14px", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: BURG, background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 99, padding: "2px 10px" }}>{typeLabel(r.type)}</span>
                  </td>
                  <td style={{ padding: "9px 14px", whiteSpace: "nowrap", color: BURG, fontWeight: 600 }}>{r.reference}</td>
                  <td style={{ padding: "9px 14px", color: INK, lineHeight: 1.5 }}>{r.detail}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", whiteSpace: "nowrap", color: BURG, fontWeight: 700 }}>{formatLedgerMoney(r.value)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", whiteSpace: "nowrap", color: INK, opacity: 0.6 }}>{formatLedgerMoney(r.runningTotal)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", fontFamily: F.serif, fontStyle: "italic", color: INK, opacity: 0.5 }}>No entries match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HomeTab({ displayName, setTab, role, openAsk }) {
  // Instant render: seed with the bundled demo summary, then refresh
  // silently in the background — the tiles never show a loading state.
  const [stats, setStats] = useState(DEMO_SUMMARY);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const fromIso = dayStart.toISOString();
        const toIso = now.toISOString();
        const res = await fetch(`/api/insights/summary?from=${fromIso}&to=${toIso}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        if (!cancelled) setStats(json);
      } catch (e) {
        if (!cancelled) setStatsError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isAgentTier = ["New Starter", "Agent", "Ops", "Lead Agent"].includes(role);
  const isImpactRole = ["Manager", "Admin", "Owner"].includes(role);
  // "My day" — the agent's own picture: logs today, anything pending
  // review, and one-tap Ask LUMÉ shortcuts.
  const myDay = useMemo(() => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const todayCount = (rows) => rows.filter((r) => new Date(r.createdAt) >= startOfDay).length;
    const ars = adverseReactionsSeed();
    return {
      issues: todayCount(issuesSeed()),
      replacements: todayCount(replacementsSeed()),
      feedback: todayCount(feedbackSeed()),
      reactions: todayCount(ars),
      pendingReview: ars.filter((r) => r.status === "under-review").length,
    };
  }, []);

  const today = new Date();
  const firstName = (displayName?.trim()?.split(/\s+/)?.[0]) || "team";
  const prefix = greetingPrefix(today.getHours());
  const tagline = pickGreetingForDay(today);
  const quote = pickByDay(QUOTES, today);

  const todayEvents = eventsInWindow(TEAM, today, 0);
  const upcoming = nextUpcomingEvents(TEAM, today, 3);

  const eyebrow = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const sectionLabel = { fontFamily: F.sans, fontSize: 10, color: BURG, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 18, opacity: 0.55 };

  // 2.6/3.2 — Manager, Admin and Owner land on the Impact home: the
  // money leads, celebrations compress to a strip.
  if (isImpactRole) {
    return <ImpactHome displayName={displayName} setTab={setTab} role={role} stats={stats} />;
  }

  return (
    <div style={{ background: CREAM, minHeight: "100vh", color: INK }}>
      {/* Marquee announcements banner */}
      <style>{`
        @keyframes luma-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .luma-marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div style={{ background: BURG, overflow: "hidden", padding: "12px 0", borderBottom: "1px solid " + DARK_BORDER }}>
        <div className="luma-marquee-track" style={{ display: "inline-flex", whiteSpace: "nowrap", animation: "luma-marquee 140s linear infinite" }}>
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => {
            const status = announcementStatus(a.date, today);
            const tagText = status === "live" ? "Live" : status === "today" ? "Today" : "Upcoming";
            const tagColor = status === "live" ? "#7FBE7F" : status === "today" ? "#FFB3B3" : GOLD;
            return (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "0 32px", fontFamily: F.sans, fontSize: 13 }}>
                <span style={{ color: tagColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, fontSize: 10 }}>{tagText}</span>
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: CREAM, fontWeight: 500, textDecoration: "underline", textDecorationColor: GOLD, textUnderlineOffset: 4 }}>{a.title}</a>
                ) : a.dest && canAccessTab(a.dest, role) ? (
                  <button onClick={() => setTab(a.dest)} style={{ background: "transparent", border: "none", padding: 0, color: CREAM, fontWeight: 500, fontFamily: F.sans, fontSize: 13, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(196,169,107,0.5)", textUnderlineOffset: 4 }}>{a.title}</button>
                ) : (
                  <span style={{ color: CREAM, fontWeight: 500 }}>{a.title}</span>
                )}
                <span style={{ color: "#C8BCAA", fontSize: 11, letterSpacing: 1 }}>{formatDateShort(new Date(a.date))}</span>
                <span style={{ color: GOLD, opacity: 0.5 }}>•</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero greeting */}
      <div style={{ padding: "96px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ ...eyebrow, marginBottom: 20 }}>LUMÉ HAIR Hub</div>
            <div style={{ fontFamily: F.serif, fontSize: "clamp(38px, 8vw, 64px)", color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 18, letterSpacing: -1.5 }}>
              {prefix}, {firstName}.
            </div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 22, color: INK, opacity: 0.65, maxWidth: 600, lineHeight: 1.4 }}>
              {tagline}
            </div>
          </div>

        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>

        {/* Hairline divider */}
        <div style={{ height: 1, background: SOFT_BORDER, marginBottom: 40 }} />

        {/* Stats — separate rounded tiles */}
        <div style={sectionLabel}>Today, so far</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 56 }}>
          <PremiumTile
            label="Tickets handled"
            value={stats?.volume != null ? stats.volume.toLocaleString() : "—"}
            hint={stats?.volume != null ? `${stats.volume.toLocaleString()} today` : "today"}
            trend={DEMO_TREND.tickets}
          />
          <PremiumTile
            label="CSAT"
            value={stats?.csat?.average != null ? stats.csat.average.toFixed(2) : "—"}
            hint={stats?.csat?.count ? `${stats.csat.count} responses today` : "no responses yet"}
            trend={DEMO_TREND.csat}
          />
          <PremiumTile
            label="Avg resolution"
            value={formatDuration(stats?.resolution?.avgSeconds)}
            hint={stats?.resolution?.count ? `${stats.resolution.count} closed` : "—"}
            trend={DEMO_TREND.resolution}
          />
          <PremiumTile
            label="Open"
            value={stats?.byStatus?.open != null ? stats.byStatus.open.toLocaleString() : "—"}
            hint="awaiting reply · team"
            trend={DEMO_TREND.open}
          />
        </div>

        {isAgentTier && (
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 16, padding: "24px 30px", marginTop: -36, marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 600 }}>My day</div>
              {myDay.pendingReview > 0 && (
                <span style={{ fontFamily: F.sans, fontSize: 11, color: BURG, background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 99, padding: "3px 12px" }}>
                  {myDay.pendingReview} of mine pending review
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 26, marginBottom: 16 }}>
              {[["Issues", myDay.issues], ["Replacements", myDay.replacements], ["Feedback", myDay.feedback], ["Reactions", myDay.reactions]].map(([label, n]) => (
                <div key={label}>
                  <span style={{ fontFamily: F.serif, fontSize: 26, color: BURG, fontWeight: 600, marginRight: 8 }}>{n}</span>
                  <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6 }}>{label} logged today</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55, marginRight: 4 }}>Quick asks:</span>
              {["Refund outside 30 days?", "Customer reports tingling", "How do I save a cancel?"].map((c) => (
                <button key={c} onClick={() => openAsk(c)} style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 12, padding: "6px 14px", borderRadius: 99, cursor: "pointer" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quote of the day — large editorial block on white */}
        <div style={{ background: W, padding: "56px 56px", marginBottom: 56, position: "relative", border: "1px solid " + SOFT_BORDER, borderLeft: "2px solid " + GOLD, borderRadius: 18 }}>
          <div style={{ ...eyebrow, marginBottom: 24 }}>Quote of the day</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: BURG, fontWeight: 400, lineHeight: 1.35, maxWidth: 820, marginBottom: 24, letterSpacing: -0.3 }}>
            &ldquo;{quote.text}&rdquo;
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
            — {quote.source}
          </div>
        </div>

        {/* Mission card — Luma CX */}
        <div style={{ background: BURG, marginBottom: 56, position: "relative", overflow: "hidden", borderRadius: 18 }}>
          <div style={{ padding: "56px 56px", borderLeft: "2px solid " + GOLD }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 20 }}>LUMÉ HAIR Promise</div>
            <div style={{ fontFamily: F.serif, fontSize: 42, fontWeight: 600, color: CREAM, marginBottom: 24, lineHeight: 1.1, letterSpacing: -1 }}>
              Every customer deserves to feel heard, helped, and valued.
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 15, color: CREAM, opacity: 0.7, lineHeight: 1.7, maxWidth: 620, marginBottom: 32 }}>
              That's not a policy — it's who we are. Every serum we sell, every ticket we close, every save we make is in service of that promise.
            </div>
            <div style={{ display: "flex", gap: 48 }}>
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: GOLD, lineHeight: 1 }}>4.6</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: CREAM, opacity: 0.6, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>CSAT</div>
              </div>
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: GOLD, lineHeight: 1 }}>34m</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: CREAM, opacity: 0.6, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>Avg Resolution</div>
              </div>
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: GOLD, lineHeight: 1 }}>43%</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: CREAM, opacity: 0.6, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>Save Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today + Coming up — separate rounded cards */}
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 56 }}>
          <div style={{ background: W, padding: "36px 40px", borderRadius: 16, border: "1px solid " + SOFT_BORDER }}>
            <div style={{ ...eyebrow, marginBottom: 24, color: BURG, opacity: 0.55 }}>Today</div>
            {todayEvents.length === 0 ? (
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>No celebrations today.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {todayEvents.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 22 }}>{e.type === "birthday" ? "🎂" : "🎉"}</span>
                    <div>
                      <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600 }}>{e.person.name}</div>
                      <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>
                        {e.type === "birthday" ? "Birthday" : `${e.years} year${e.years === 1 ? "" : "s"} at LUMÉ HAIR`} · {e.person.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: W, padding: "36px 40px", borderRadius: 16, border: "1px solid " + SOFT_BORDER }}>
            <div style={{ ...eyebrow, marginBottom: 24, color: BURG, opacity: 0.55 }}>Coming up</div>
            {upcoming.length === 0 ? (
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>Nothing on the radar.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {upcoming.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 20 }}>{e.type === "birthday" ? "🎂" : "🎉"}</span>
                      <div>
                        <div style={{ fontFamily: F.serif, fontSize: 17, color: BURG, fontWeight: 600 }}>{firstNameOf(e.person.name)}</div>
                        <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>
                          {e.type === "birthday" ? "Birthday" : `${e.years}-year anniversary`}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap", letterSpacing: 2, textTransform: "uppercase", border: "1px solid " + SOFT_BORDER, padding: "6px 10px" }}>
                      {e.daysAway === 1 ? "Tomorrow" : `${formatDateShort(e.date)} · ${e.daysAway}d`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links — burgundy filled rounded pills */}
        <div style={sectionLabel}>Jump to</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {["Insights", "Logs", "Reports", "Records"]
            .filter((t) => {
              if (role === "Ops") return t === "Logs";
              if (t === "Logs") return role !== "New Starter";
              if (t === "Reports") return role && ["Lead Agent","Manager","Admin","Owner"].includes(role);
              if (t === "Records") return role && ["Manager","Admin","Owner"].includes(role);
              return true;
            })
            .map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: BURG, border: "1px solid " + BURG, color: CREAM, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "14px 26px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s", borderRadius: 99 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = RED; e.currentTarget.style.borderColor = RED; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BURG; e.currentTarget.style.borderColor = BURG; }}
            >
              {t} →
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Chart & form primitives (Part 5.1 / 5.2) ────────────────────────────────
// Restrained, editorial data-viz: thin gold strokes, no gridlines, the
// number stays the hero. Every headline stat pairs a 30-day sparkline
// with a delta chip vs the previous period.

const CHIP_GREEN = "#3F7A4E";
const CHIP_RED = "#A5544A";

function DeltaChip({ delta, good }) {
  if (!delta) return null;
  const up = String(delta).trim().startsWith("+") ? true : String(delta).trim().startsWith("-") ? false : true;
  const color = good ? CHIP_GREEN : CHIP_RED;
  const soft = good ? "rgba(63,122,78," : "rgba(165,84,74,";
  return (
    <span title="vs previous period" style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color, background: soft + "0.08)", border: "1px solid " + soft + "0.22)", borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap", lineHeight: 1.6 }}>
      {up ? "▲" : "▼"} {String(delta).replace(/^[+-]\s*/, "")}
    </span>
  );
}

function Sparkline({ data, width = 88, height = 30, stroke = GOLD }) {
  const { path, lastX, lastY } = sparklinePath(data || [], width, height, 3);
  if (!path) return null;
  return (
    <svg width={width} height={height} viewBox={"0 0 " + width + " " + height} style={{ display: "block", flexShrink: 0 }} aria-hidden="true">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={lastX} cy={lastY} r="2.2" fill={BURG} />
    </svg>
  );
}

// Horizontal bar list — counts as bars, not text lists. Entries are
// [label, count] pairs or {key, count} objects.
function HBarList({ entries, total, accent = GOLD, labelWidth = 170 }) {
  const rows = (entries || []).map((e) => Array.isArray(e) ? { key: e[0], count: e[1] } : e);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.map((r) => {
        const pct = total ? Math.round((r.count / total) * 100) : null;
        return (
          <div key={r.key} className="luma-bar-row" style={{ display: "grid", gridTemplateColumns: labelWidth + "px 1fr 76px", alignItems: "center", gap: 10 }}>
            <div className="luma-bar-label" style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", gridColumn: 1 }} title={r.key}>{r.key}</div>
            <div className="luma-bar-track" style={{ background: "#EFE9DF", borderRadius: 99, height: 6, overflow: "hidden", gridColumn: 2 }}>
              <div style={{ background: accent, width: Math.max(2, Math.round((r.count / max) * 100)) + "%", height: "100%", borderRadius: 99 }} />
            </div>
            <div className="luma-bar-value" style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, textAlign: "right", whiteSpace: "nowrap", gridColumn: 3 }}>
              {r.count.toLocaleString()}{pct != null && <span style={{ opacity: 0.55 }}> · {pct}%</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Toast system ────────────────────────────────────────────────────────────
// Global notify() + a single <ToastHost /> mounted in App. Toasts are the
// confirmation layer for every quick action (log saved, draft copied,
// inserted into Gorgias). Design-system styled: cream card, gold accent.
let _toastListeners = [];
function notify(message, opts = {}) {
  const t = { id: Date.now() + Math.random(), message, ...opts };
  _toastListeners.forEach((fn) => fn(t));
}

function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const push = (t) => {
      setToasts((cur) => [...cur.slice(-3), t]);
      const ttl = t.duration || 4200;
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), ttl);
    };
    _toastListeners.push(push);
    return () => { _toastListeners = _toastListeners.filter((f) => f !== push); };
  }, []);
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto", background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + GOLD, borderRadius: 10, boxShadow: "0 8px 28px rgba(10,10,9,0.14)", padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, maxWidth: 480 }}>
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK }}>{t.message}</span>
          {t.action && (
            <button onClick={t.action.onClick} style={{ background: "transparent", border: "none", fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: BURG, textDecoration: "underline", cursor: "pointer", whiteSpace: "nowrap", padding: 0 }}>
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Combobox — the app's only select control (no native <select>) ──────────
// Type-ahead single select styled to the design system: cream panel,
// letter-spaced current value, keyboard-first (arrows / Enter / Esc).
function Combobox({
  value, onChange, options, placeholder = "Select…",
  allowEmpty = false, emptyLabel = "—",
  autoFocus = false, onCommit, onCancel,
  style = {}, panelWidth, disabled = false, title,
}) {
  const items = (options || []).map((o) => (o && typeof o === "object" ? o : { value: o, label: o === "" ? emptyLabel : String(o) }));
  const all = allowEmpty && !items.some((i) => i.value === "") ? [{ value: "", label: emptyLabel }, ...items] : items;
  const [open, setOpen] = useState(autoFocus);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const current = all.find((i) => i.value === value) || all.find((i) => i.label === value) || null;
  const q = query.trim().toLowerCase();
  const filtered = q ? all.filter((i) => String(i.label).toLowerCase().includes(q)) : all;

  useEffect(() => {
    if (open) {
      setQuery("");
      const idx = filtered.findIndex((i) => i === current);
      setHi(idx >= 0 ? idx : 0);
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function select(item) {
    if (!item) return;
    onChange(item.value);
    setOpen(false);
    onCommit?.(item.value);
  }
  function handleRootBlur(e) {
    if (rootRef.current && !rootRef.current.contains(e.relatedTarget)) {
      setOpen(false);
      if (open) onCommit?.(current ? current.value : value);
    }
  }
  function onInputKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); select(filtered[Math.min(hi, filtered.length - 1)]); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); onCancel?.(); }
    else if (e.key === "Tab") { setOpen(false); onCommit?.(current ? current.value : value); }
  }
  function onButtonKey(e) {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); setOpen(true); }
    else if (e.key === "Escape") { onCancel?.(); }
  }

  const base = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box", ...style };

  return (
    <div ref={rootRef} onBlur={handleRootBlur} style={{ position: "relative", width: style.width || "100%" }}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        title={title}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onButtonKey}
        onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }}
        onBlurCapture={(e) => { if (e.target === e.currentTarget) e.currentTarget.style.borderColor = style.border ? undefined : ""; }}
        style={{ ...base, textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: current ? 1 : 0.45 }}>
          {current ? current.label : placeholder}
        </span>
        <span aria-hidden="true" style={{ fontSize: 9, color: GOLD, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, minWidth: panelWidth, zIndex: 60, background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, boxShadow: "0 10px 28px rgba(10,10,9,0.10)", overflow: "hidden" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHi(0); }}
            onKeyDown={onInputKey}
            placeholder="Type to filter"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px", border: "none", borderBottom: "1px solid " + SOFT_BORDER, background: CREAM, fontFamily: F.sans, fontSize: 12, color: INK, outline: "none" }}
          />
          <div role="listbox" style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 14px", fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.5 }}>No matches</div>
            )}
            {filtered.map((item, i) => {
              const active = i === hi;
              const selected = current && item.value === current.value;
              return (
                <div
                  key={String(item.value) + i}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => { e.preventDefault(); select(item); }}
                  style={{ padding: "9px 14px", cursor: "pointer", background: active ? CREAM : W, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                >
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: INK, fontWeight: selected ? 700 : 400 }}>{item.label}</span>
                  {selected && <span style={{ color: GOLD, fontSize: 11 }}>●</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Sticky bottom action bar for forms longer than a viewport (5.2).
function FormActionBar({ children, note }) {
  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 30, margin: "20px -28px -24px", padding: "14px 28px", background: "rgba(250,248,243,0.97)", backdropFilter: "blur(6px)", borderTop: "1px solid " + SOFT_BORDER, borderRadius: "0 0 14px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 12, color: INK, opacity: 0.55 }}>{note || ""}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>
    </div>
  );
}

// Letter-spaced caps section header inside long forms (5.2).
function FormSection({ title }) {
  return (
    <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", margin: "22px 0 12px", paddingTop: 16, borderTop: "1px solid #EFE9DF" }}>
      {title}
    </div>
  );
}

function PremiumTile({ label, value, hint, trend }) {
  return (
    <div style={{ background: W, padding: "28px 30px", minHeight: 130, borderRadius: 16, border: "1px solid " + SOFT_BORDER }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 600 }}>
          {label}
        </div>
        {trend && <DeltaChip delta={trend.delta} good={trend.good} />}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 500, lineHeight: 1, letterSpacing: -1 }}>
          {value}
        </div>
        {trend && <Sparkline data={trend.series} />}
      </div>
      {hint && (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 10, letterSpacing: 0.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Training Tab (wrapper with internal sub-nav) ─────────────────
const TRAINING_SUBTABS = ["Bootcamp", "Simulate", "Quiz", "Compare", "Progress"];

// Demo review queue for Lead Agent+ — trainee submissions awaiting a
// human pass on top of the AI grade.
const TRAINING_REVIEW_QUEUE = [
  { trainee: "Ruby Tran",    item: "Scenario 4 — Cancel save via formula swap", aiScore: 82, waiting: "2h" },
  { trainee: "Jack Halloran", item: "Scenario 9 — Refund outside 30 days",      aiScore: 78, waiting: "5h" },
  { trainee: "Mia Castellanos", item: "Week 2 writing — lost package",          aiScore: 88, waiting: "1d" },
];

function TrainingTab(props) {
  const role = props.role;
  const [sub, setSub] = useState("Bootcamp");
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const isNewStarter = role === "New Starter";
  const isReviewer = ["Lead Agent", "Manager"].includes(role);
  const isEditor = ["Admin", "Owner"].includes(role);

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ HAIR — Training</div>
        <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 24, letterSpacing: -1 }}>
          {sub}
        </div>

        {/* Role-aware shell (Module B): New Starters see their own path;
            Agents get reference mode; Lead+ review; Admin+ edit. */}
        {isNewStarter && (
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600 }}>Your 30-day path — Day 12</div>
              <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: "uppercase" }}>40% complete</div>
            </div>
            <div style={{ background: "#EFE9DF", borderRadius: 99, height: 8, overflow: "hidden", margin: "12px 0 10px" }}>
              <div style={{ background: GOLD, width: "40%", height: "100%", borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, opacity: 0.7 }}>
                You're in <strong style={{ color: BURG }}>Week 2 — The Playbook</strong> · next up: policy edge cases and the escalation map
              </div>
              <button onClick={() => setSub("Bootcamp")} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
                Continue
              </button>
            </div>
          </div>
        )}
        {role === "Agent" && (
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.75 }}>
            Reference mode — you've graduated. Revisit any module, scenario, or the compare matrix whenever you need a refresher.
          </div>
        )}
        {isReviewer && (
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>Review queue — {TRAINING_REVIEW_QUEUE.length} waiting</div>
            {TRAINING_REVIEW_QUEUE.map((q, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderTop: i > 0 ? "1px solid #F0EBE3" : "none", flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.sans, fontSize: 13, color: BURG, fontWeight: 700, width: 130 }}>{q.trainee}</span>
                <span style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, flex: 1, minWidth: 200 }}>{q.item}</span>
                <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>AI score {q.aiScore} · waiting {q.waiting}</span>
                <button onClick={() => notify(`Opening ${q.trainee}'s submission — demo`)} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "4px 12px", borderRadius: 99, cursor: "pointer" }}>Review</button>
              </div>
            ))}
          </div>
        )}
        {isEditor && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 18px", marginBottom: 20 }}>
            <span style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, opacity: 0.75 }}>You can edit the curriculum — changes publish to every New Starter's path.</span>
            <button onClick={() => notify("Curriculum editor — demo")} style={{ background: "transparent", border: "1px solid " + BURG, color: BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "8px 16px", borderRadius: 99, cursor: "pointer" }}>Edit curriculum</button>
          </div>
        )}
        {/* Sub-nav pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TRAINING_SUBTABS.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => setSub(s)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content (inherits cream bg from wrapper) */}
      {sub === "Bootcamp" && <BootcampTab
        bcProgress={props.bcProgress} saveBcProgress={props.saveBcProgress}
        bcView={props.bcView} setBcView={props.setBcView}
        bcDay={props.bcDay} setBcDay={props.setBcDay}
        bcLesson={props.bcLesson} setBcLesson={props.setBcLesson}
        bcQIdx={props.bcQIdx} setBcQIdx={props.setBcQIdx}
        bcChosen={props.bcChosen} setBcChosen={props.setBcChosen}
        bcAnswers={props.bcAnswers} setBcAnswers={props.setBcAnswers}
        bcWriteInput={props.bcWriteInput} setBcWriteInput={props.setBcWriteInput}
        bcWriteFeedback={props.bcWriteFeedback} bcWriteLoading={props.bcWriteLoading}
        bcWriteDone={props.bcWriteDone} setBcWriteDone={props.setBcWriteDone}
        setBcWriteFeedback={props.setBcWriteFeedback} submitWritingExercise={props.submitWritingExercise}
        playerName={props.playerName}
      />}
      {sub === "Simulate" && <SimTab
        selScen={props.selScen} setSelScen={props.setSelScen}
        simMsgs={props.simMsgs} simInput={props.simInput} setSimInput={props.setSimInput}
        simLoading={props.simLoading} simFeedback={props.simFeedback}
        simDone={props.simDone} sendSim={props.sendSim} startScen={props.startScen}
        simEndRef={props.simEndRef}
      />}
      {sub === "Quiz" && <QuizTab
        selMod={props.selMod} setSelMod={props.setSelMod}
        qIdx={props.qIdx} chosen={props.chosen} answers={props.answers}
        sessionScores={props.sessionScores} completed={props.completed}
        startMod={props.startMod} pickAnswer={props.pickAnswer}
        nextQ={props.nextQ} finishMod={props.finishMod}
      />}
      {sub === "Compare" && <CompareTab />}
      {sub === "Progress" && <ProgressTab
        totalScore={props.totalScore} completed={props.completed}
        sessionScores={props.sessionScores} setTab={props.setTab} setSelMod={props.setSelMod}
      />}
    </div>
  );
}

// ─── Records Tab ─────────────────────────────────────────────────
// Spreadsheet-style view of every log table with click-to-edit cells +
// CSV download. Manager+ only.

// "Cancellations" hidden May 13 — Skio is the source of truth (per Aina).
// Model + API + config preserved as orphans in case we revive it.
const RECORDS_SUBTABS = ["Order Issue", "Replacements", "Reaction/Concern", "Feedback", "Claims"];

// RECORDS_CONFIG is built lazily inside RecordsTab so it can reference
// the dropdown constants declared in the Logs section (ISSUE_CATEGORIES,
// OPS_REGIONS, etc.). At module load time those are still in TDZ.
function buildRecordsConfig() {
  return {
  "Order Issue": {
    listUrl: "/api/logs/issues",
    patchUrl: (id) => `/api/logs/issues/${id}`,
    columns: [
      { key: "createdAt",      label: "Created",   type: "date",     editable: false, width: 130 },
      { key: "orderId",        label: "Order ID",  type: "text",     editable: false, width: 110 },
      { key: "ticketId",       label: "Ticket #",  type: "text",     editable: true,  width: 110 },
      { key: "customerName",   label: "Customer",  type: "text",     editable: true,  width: 150 },
      { key: "customerEmail",  label: "Email",     type: "text",     editable: true,  width: 200 },
      { key: "country",        label: "Country",   type: "text",     editable: true,  width: 80 },
      { key: "warehouse",      label: "Warehouse", type: "select",   editable: true,  width: 110, options: ["", ...ISSUE_WAREHOUSES] },
      { key: "category",       label: "Category",  type: "select",   editable: true,  width: 130, options: ISSUE_CATEGORIES.map(c => c.value), labels: ISSUE_CATEGORIES },
      { key: "severity",       label: "Severity",  type: "select",   editable: true,  width: 90,  options: ISSUE_SEVERITY.map(s => s.value), labels: ISSUE_SEVERITY },
      { key: "resolution",     label: "Resolution",type: "select",   editable: true,  width: 110, options: ISSUE_RESOLUTIONS.map(r => r.value), labels: ISSUE_RESOLUTIONS },
      { key: "itemsAffected",  label: "Items",     type: "csv",      editable: true,  width: 160 },
      { key: "description",    label: "Description",type: "textarea",editable: true,  width: 280 },
      { key: "resolutionNotes",label: "Notes",     type: "textarea", editable: true,  width: 200 },
    ],
  },
  Replacements: {
    listUrl: "/api/logs/replacements",
    patchUrl: (id) => `/api/logs/replacements/${id}`,
    // Updated May 13 per Aina's testing — new two-tier reason + Items Affected.
    // `type` and `status` removed (always default values now).
    // Legacy single `reason` shown but read-only for old-row backwards compat.
    // Legacy `itemsToShip` hidden — superseded by `itemsAffected`.
    columns: [
      { key: "createdAt",     label: "Created",       type: "date",     editable: false, width: 130 },
      { key: "orderId",       label: "Order ID",      type: "text",     editable: false, width: 110 },
      { key: "ticketId",      label: "Ticket #",      type: "text",     editable: true,  width: 110 },
      { key: "customerName",  label: "Customer",      type: "text",     editable: true,  width: 150 },
      { key: "country",       label: "Country",       type: "text",     editable: true,  width: 80 },
      { key: "warehouse",     label: "Warehouse",     type: "select",   editable: true,  width: 110, options: ["", ...ISSUE_WAREHOUSES] },
      { key: "reasonMains",   label: "Main reason",   type: "csv",      editable: true,  width: 180, labels: REPLACEMENT_REASONS },
      { key: "reasonSubs",    label: "Sub reason",    type: "csv",      editable: true,  width: 220 },
      { key: "itemsAffected", label: "Items",         type: "csv",      editable: true,  width: 200 },
      { key: "courier",       label: "Courier",       type: "text",     editable: true,  width: 100 },
      { key: "details",       label: "Details",       type: "textarea", editable: true,  width: 240 },
      { key: "solution",      label: "Solution",      type: "text",     editable: true,  width: 220 },
      // Legacy fallback for pre-May-13 rows — read-only display
      { key: "reason",        label: "Legacy reason", type: "text",     editable: false, width: 130 },
    ],
  },
  Cancellations: {
    listUrl: "/api/logs/cancellations",
    patchUrl: (id) => `/api/logs/cancellations/${id}`,
    columns: [
      { key: "createdAt",        label: "Created",  type: "date",   editable: false, width: 130 },
      { key: "orderId",          label: "Order ID", type: "text",   editable: false, width: 110 },
      { key: "ticketId",         label: "Ticket #", type: "text",   editable: true,  width: 110 },
      { key: "customerName",     label: "Customer", type: "text",   editable: true,  width: 150 },
      { key: "customerEmail",    label: "Email",    type: "text",   editable: true,  width: 200 },
      { key: "country",          label: "Country",  type: "text",   editable: true,  width: 80 },
      { key: "cancellationType", label: "Reason",   type: "select", editable: true,  width: 160, options: CANCELLATION_TYPES.map(c => c.value), labels: CANCELLATION_TYPES },
      { key: "scope",            label: "Scope",    type: "select", editable: true,  width: 130, options: CANCELLATION_SCOPES.map(s => s.value), labels: CANCELLATION_SCOPES },
      { key: "notes",            label: "Notes",    type: "textarea",editable: true, width: 280 },
    ],
  },
  Feedback: {
    listUrl: "/api/logs/feedback",
    patchUrl: (id) => `/api/logs/feedback/${id}`,
    columns: [
      { key: "createdAt",     label: "Created",  type: "date",     editable: false, width: 130 },
      { key: "orderId",       label: "Order ID", type: "text",     editable: true,  width: 110 },
      { key: "ticketId",      label: "Ticket #", type: "text",     editable: true,  width: 110 },
      { key: "customerName",  label: "Customer", type: "text",     editable: true,  width: 150 },
      { key: "country",       label: "Country",  type: "text",     editable: true,  width: 80 },
      { key: "theme",         label: "Theme",    type: "select",   editable: true,  width: 130, options: FEEDBACK_THEMES.map(t => t.value), labels: FEEDBACK_THEMES },
      { key: "relatedTeam",   label: "Team",     type: "select",   editable: true,  width: 130, options: ["", ...FEEDBACK_TEAMS] },
      { key: "details",       label: "Details",  type: "textarea", editable: true,  width: 320 },
      { key: "suggestion",    label: "Suggestion",type: "textarea",editable: true,  width: 240 },
    ],
  },
  "Reaction/Concern": {
    listUrl: "/api/logs/adverse-reactions",
    patchUrl: (id) => `/api/logs/adverse-reactions/${id}`,
    columns: [
      { key: "createdAt",            label: "Created",   type: "date",     editable: false, width: 130 },
      { key: "orderId",              label: "Order ID",  type: "text",     editable: false, width: 110 },
      { key: "customerName",         label: "Customer",  type: "text",     editable: true,  width: 150 },
      { key: "country",              label: "Country",   type: "text",     editable: true,  width: 80 },
      { key: "complaintMethod",      label: "Method",    type: "select",   editable: true,  width: 110, options: AR_METHODS.map(m => m.value), labels: AR_METHODS },
      { key: "severity",             label: "Severity",  type: "select",   editable: true,  width: 110, options: AR_SEVERITY.map(s => s.value), labels: AR_SEVERITY },
      { key: "isSerious",            label: "SAE",       type: "bool",     editable: true,  width: 60 },
      { key: "complaintDescription", label: "Verbatim",  type: "textarea", editable: true,  width: 320 },
      { key: "symptoms",             label: "Symptoms",  type: "csv",      editable: true,  width: 180 },
      { key: "productsAffected",     label: "Products",  type: "csv",      editable: true,  width: 180 },
      { key: "lotNumbers",           label: "Lots",      type: "csv",      editable: true,  width: 120 },
      { key: "escalatedTo",          label: "Escalated", type: "select",   editable: true,  width: 130, options: ["", ...AR_ESCALATION] },
      { key: "fdaMedwatchFiled",     label: "MEDWATCH",  type: "bool",     editable: true,  width: 90 },
      { key: "mrddNumber",           label: "MRDD #",    type: "text",     editable: true,  width: 100 },
      { key: "qcReviewer",           label: "QC reviewer",type: "text",    editable: true,  width: 130 },
      { key: "qcNotes",              label: "QC notes",  type: "textarea", editable: true,  width: 200 },
      { key: "status",               label: "Status",    type: "select",   editable: true,  width: 130, options: AR_STATUS.map(s => s.value), labels: AR_STATUS },
    ],
  },
  Claims: {
    listUrl: "/api/logs/claims",
    patchUrl: (id) => `/api/logs/claims/${id}`,
    columns: [
      { key: "createdAt",       label: "Created",   type: "date",   editable: false, width: 110 },
      { key: "claimRef",        label: "Claim ref", type: "text",   editable: false, width: 100 },
      { key: "orderId",         label: "Order ID",  type: "text",   editable: false, width: 110 },
      { key: "ticketId",        label: "Ticket #",  type: "text",   editable: true,  width: 90 },
      { key: "warehouse",       label: "Warehouse", type: "select", editable: true,  width: 130, options: ISSUE_WAREHOUSES },
      { key: "category",        label: "Category",  type: "select", editable: true,  width: 160, options: CLAIM_CATEGORIES.map(c => c.value), labels: CLAIM_CATEGORIES },
      { key: "items",           label: "Items",     type: "csv",    editable: false, width: 180, format: (items) => (items || []).map((i) => `${i.sku} ×${i.qty}`).join(", ") },
      { key: "claimTotalValue", label: "Claim $",   type: "text",   editable: false, width: 90,  format: (v) => v != null ? Number(v).toFixed(2) : "" },
      { key: "currency",        label: "Currency",  type: "text",   editable: false, width: 80 },
      { key: "status",          label: "Status",    type: "select", editable: true,  width: 200, options: CLAIM_STATUSES.map(c => c.value), labels: CLAIM_STATUSES },
      { key: "evidenceUrls",    label: "Evidence",  type: "csv",    editable: true,  width: 200 },
      { key: "notes",           label: "Notes",     type: "textarea", editable: true, width: 260 },
    ],
  },
  "Ops Requests": {
    listUrl: "/api/logs/order-requests",
    patchUrl: (id) => `/api/logs/order-requests/${id}`,
    columns: [
      { key: "createdAt",            label: "Created",   type: "date",   editable: false, width: 130 },
      { key: "region",               label: "Warehouse", type: "select", editable: true,  width: 100, options: OPS_REGIONS.map(r => r.value) },
      { key: "orderRef",          label: "Order ref", type: "text",   editable: true,  width: 110 },
      { key: "ticketId",             label: "Ticket #",  type: "text",   editable: true,  width: 110 },
      { key: "recipientName",        label: "Recipient", type: "text",   editable: true,  width: 150 },
      { key: "shipToCity",           label: "City",      type: "text",   editable: true,  width: 110 },
      { key: "shipToCountry",        label: "Country",   type: "text",   editable: true,  width: 90 },
      { key: "itemsDescription",     label: "Items",     type: "textarea",editable: true, width: 240 },
      { key: "dispatchWarehouse",    label: "Warehouse", type: "text",   editable: true,  width: 150 },
      { key: "shipCarrier",          label: "Carrier",   type: "text",   editable: true,  width: 100 },
      { key: "awb",                  label: "AWB#",      type: "text",   editable: true,  width: 130 },
      { key: "referenceNumber",      label: "Reference#",type: "text",   editable: true,  width: 130 },
      { key: "omsOrderNumber", label: "OMS SO#",  type: "text",   editable: true,  width: 130 },
      { key: "shipDate",             label: "Ship date", type: "date",   editable: true,  width: 110 },
      { key: "sent",                 label: "Sent",      type: "bool",   editable: true,  width: 60 },
      { key: "status",               label: "Status",    type: "select", editable: true,  width: 110, options: OPS_STATUSES.map(s => s.value), labels: OPS_STATUSES },
      { key: "notes",                label: "Notes",     type: "textarea",editable: true, width: 200 },
    ],
  },
  };
}

function RecordsTab({ role }) {
  const canView = role && ["Manager","Admin","Owner"].includes(role);
  const [sub, setSub] = useState("Order Issue");
  const RECORDS_CONFIG = useMemo(buildRecordsConfig, []);

  // Deep-link from email: #records:issues, #records:adverse-reactions etc.
  // Parses the second part and matches against RECORDS_SUBTABS case-/dash-
  // insensitively so "adverse-reactions" → "Adverse Reactions".
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash || !hash.includes(":")) return;
    const subPart = hash.split(":").slice(1).join(":").replace(/-/g, " ");
    const matched = RECORDS_SUBTABS.find((s) => s.toLowerCase() === subPart.toLowerCase());
    if (matched) setSub(matched);
  }, []);
  if (!canView) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 600, marginBottom: 14 }}>Records</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6 }}>
            Records are visible to Manager and above. This is the editable spreadsheet view of every log.
          </div>
        </div>
      </div>
    );
  }
  const config = RECORDS_CONFIG[sub];
  const RECORDS_TAGLINES = {
    "Order Issue":      "Every order issue logged across the team.",
    "Replacements":     "Every replacement request, intake through delivery.",
    "Reaction/Concern": "Every adverse reaction or skin concern on file.",
    "Feedback":         "Every customer feedback note and feature request.",
    "Claims":           "Every Parcelline claim with item-level landed costs — the audit trail behind Recovery.",
  };
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: "100%", padding: "40px 24px 16px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>LUMÉ HAIR — Records</div>
        <div style={{ fontFamily: F.serif, fontSize: 36, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 8 }}>{sub}</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6, marginBottom: 18, maxWidth: 760 }}>
          {RECORDS_TAGLINES[sub] ?? "Every log entry in one editable view."}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RECORDS_SUBTABS.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => setSub(s)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px",
                letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
              }}>{s}</button>
            );
          })}
        </div>
      </div>
      <RecordsGrid key={sub} subName={sub} config={config} />
    </div>
  );
}

// Seed rows per Records list URL — the grid renders instantly and then
// refreshes silently from the API.
const RECORDS_SEEDS = {
  "/api/logs/claims": claimsSeed,
  "/api/logs/issues": issuesSeed,
  "/api/logs/replacements": replacementsSeed,
  "/api/logs/cancellations": cancellationsSeed,
  "/api/logs/feedback": feedbackSeed,
  "/api/logs/adverse-reactions": adverseReactionsSeed,
  "/api/logs/order-requests": orderRequestsSeed,
};

function RecordsGrid({ subName, config }) {
  const [rows, setRows] = useState(() => RECORDS_SEEDS[config.listUrl]?.() ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [editing, setEditing] = useState(null); // { rowId, key, value }
  const [savingId, setSavingId] = useState(null);
  const [drawerRow, setDrawerRow] = useState(null); // 5.3 — right-side record drawer

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.listUrl}?limit=500`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRows(json.rows ?? []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [config.listUrl]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
  });
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  function startEdit(rowId, col, currentValue) {
    if (!col.editable) return;
    let initialValue;
    if (col.type === "csv") initialValue = (currentValue ?? []).join(", ");
    else if (col.type === "bool") initialValue = !!currentValue;
    else if (col.type === "date") initialValue = currentValue ? new Date(currentValue).toISOString().slice(0, 10) : "";
    else initialValue = currentValue ?? "";
    setEditing({ rowId, key: col.key, value: initialValue });
  }
  function cancelEdit() { setEditing(null); }

  async function commitEdit(overrideValue) {
    if (!editing) return;
    const { rowId, key } = editing;
    const value = typeof overrideValue === "string" || typeof overrideValue === "boolean" ? overrideValue : editing.value;
    const col = config.columns.find((c) => c.key === key);
    let payloadValue;
    if (col.type === "csv") payloadValue = String(value).split(",").map((s) => s.trim()).filter(Boolean);
    else if (col.type === "bool") payloadValue = !!value;
    else if (col.type === "date") payloadValue = value || null;
    else payloadValue = value === "" ? null : value;

    setEditing(null);
    setSavingId(rowId);
    try {
      const res = await fetch(config.patchUrl(rowId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: payloadValue }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRows((cur) => cur.map((r) => r.id === rowId ? json.row : r));
    } catch (e) {
      setError(`Save failed: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  }

  // Delete a row. Manager+ only on the API side; the Records tab is
  // already Manager+ gated so anyone seeing this button is authorised.
  // Confirm via native dialog — simple and reliable, no extra modal infra.
  async function deleteRow(rowId) {
    const confirmed = typeof window !== "undefined" &&
      window.confirm("Delete this row? This can't be undone.");
    if (!confirmed) return;
    setSavingId(rowId);
    try {
      const res = await fetch(config.patchUrl(rowId), { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setRows((cur) => cur.filter((r) => r.id !== rowId));
      // If the deleted row was being edited, drop the edit state too.
      setEditing((cur) => (cur && cur.rowId === rowId ? null : cur));
    } catch (e) {
      setError(`Delete failed: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  }

  function downloadCSV() {
    const escape = (v) => {
      const s = typeof v === "object" && v !== null && !Array.isArray(v) ? JSON.stringify(v) : String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    // Export display values (labels, not enum values) so the CSV reads
    // the same as the grid.
    const cell = (col, v) => {
      if (v == null || v === "") return "";
      if (col.type === "bool") return v ? "Yes" : "No";
      if (Array.isArray(v)) return displayCellValue(col, v).replace(/, /g, "; ");
      return displayCellValue(col, v);
    };
    const header = config.columns.map((c) => escape(c.label)).join(",");
    const body = sorted.map((r) => config.columns.map((c) => escape(cell(c, r[c.key]))).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cellBase = { padding: "5px 8px", fontFamily: F.sans, fontSize: 12, color: INK, borderBottom: "1px solid " + SOFT_BORDER, verticalAlign: "top" };
  const headerBase = { padding: "10px", fontFamily: F.sans, fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid " + SOFT_BORDER, background: CREAM, textAlign: "left", whiteSpace: "nowrap", cursor: "pointer", position: "sticky", top: 0, zIndex: 1 };

  return (
    <div style={{ padding: "0 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search across all columns…"
          style={{ flex: "1 1 280px", maxWidth: 400, padding: "8px 14px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>{filtered.length}{search ? ` of ${rows.length}` : ""}</span>
          <button onClick={downloadCSV} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 14px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Download CSV</button>
          <button onClick={load} disabled={loading} style={{ background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "8px 14px", letterSpacing: 1, cursor: loading ? "wait" : "pointer", borderRadius: 99 }}>Refresh</button>
        </div>
      </div>
      {error && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 10, fontFamily: F.sans, fontSize: 12 }}>{error}</div>}

      <div style={{ overflow: "auto", maxHeight: "calc(100vh - 280px)", background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
          <thead>
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{ ...headerBase, width: c.width }}>
                  {c.label} {sortKey === c.key && <span style={{ color: BURG }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </th>
              ))}
              {/* Trailing action column — delete button per row */}
              <th style={{ ...headerBase, width: 56, cursor: "default", textAlign: "center" }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F6F0E6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? W : "#fdfbf9"; }}
                  style={{ background: i % 2 === 0 ? W : "#fdfbf9", opacity: savingId === r.id ? 0.6 : 1, transition: "background 0.12s" }}>
                {config.columns.map((c) => {
                  const val = r[c.key];
                  const isEditing = editing?.rowId === r.id && editing?.key === c.key;
                  return (
                    <td key={c.key} style={{ ...cellBase, width: c.width, cursor: c.editable ? "text" : "pointer" }}
                        onClick={() => { if (isEditing) return; if (c.editable) startEdit(r.id, c, val); else setDrawerRow(r); }}>
                      {isEditing ? (
                        <EditCell col={c} value={editing.value} setValue={(v) => setEditing({ ...editing, value: v })} onCommit={commitEdit} onCancel={cancelEdit} />
                      ) : (
                        <CellDisplay col={c} value={val} />
                      )}
                    </td>
                  );
                })}
                {/* Delete action cell — stopPropagation so the row's click-to-edit
                    behaviour doesn't fire when the button is clicked. */}
                <td style={{ ...cellBase, width: 56, textAlign: "center", cursor: "default" }}
                    onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => deleteRow(r.id)}
                    disabled={savingId === r.id}
                    aria-label="Delete row"
                    title="Delete this row"
                    style={{
                      background: "transparent",
                      color: BURG,
                      border: "1px solid " + SOFT_BORDER,
                      fontFamily: F.sans, fontSize: 14, fontWeight: 700,
                      width: 28, height: 28, lineHeight: "24px", padding: 0,
                      borderRadius: 99,
                      cursor: savingId === r.id ? "wait" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = BURG; e.currentTarget.style.color = CREAM; e.currentTarget.style.borderColor = BURG; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = BURG; e.currentTarget.style.borderColor = SOFT_BORDER; }}
                  >×</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && !loading && (
              <tr><td colSpan={config.columns.length + 1} style={{ ...cellBase, textAlign: "center", fontStyle: "italic", color: INK, opacity: 0.5, padding: 24 }}>{rows.length === 0 ? "No records yet." : "No matches."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <RecordDrawer row={drawerRow} config={config} subName={subName} onClose={() => setDrawerRow(null)} />
    </div>
  );
}

// 5.3 — right-side drawer: the full record plus its audit trail. Opens
// from any non-editable cell; editing stays inline in the grid.
function RecordDrawer({ row, config, subName, onClose }) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, onClose]);
  if (!row) return null;
  const fields = config.columns.filter((c) => c.key !== "createdAt");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,10,9,0.16)", zIndex: 180 }} />
      <div role="dialog" aria-label="Record detail" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", background: CREAM, borderLeft: "1px solid " + SOFT_BORDER, boxShadow: "-14px 0 40px rgba(10,10,9,0.15)", zIndex: 185, display: "flex", flexDirection: "column" }}>
        <div style={{ background: W, padding: "16px 20px", borderBottom: "1px solid " + SOFT_BORDER, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 9, color: GOLD, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700 }}>{subName}</div>
            <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 600, color: BURG }}>{row.orderId || row.claimRef || row.cancelledOrderId || row.id}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, width: 30, height: 30, borderRadius: 99, cursor: "pointer", fontFamily: F.sans, fontSize: 14, lineHeight: "26px", padding: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {fields.map((c) => {
            const v = row[c.key];
            if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return null;
            return (
              <div key={c.key} style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  {c.type === "bool" ? (v ? "Yes" : "No") : c.type === "date" ? new Date(v).toLocaleString() : displayCellValue(c, v)}
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid " + SOFT_BORDER, marginTop: 16, paddingTop: 14 }}>
            <div style={{ fontFamily: F.sans, fontSize: 9, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>Audit</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.75, lineHeight: 1.8 }}>
              Created {new Date(row.createdAt).toLocaleString()}<br />
              {row.updatedAt ? <>Last edited {new Date(row.updatedAt).toLocaleString()} · version {(row.editCount || 1) + 1}<br /></> : <>Never edited — original version<br /></>}
              Logged by {row.agent === "demo" ? "the CX team (demo seed)" : "you"} · agents can self-edit for 60 minutes, then records lock to Manager+
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Human-readable form of any cell value: maps option values to their
// labels, strips "main::Sub" composite prefixes, joins arrays. Shared by
// the Records grid and its CSV export so no raw enum value ever renders.
function displayCellValue(col, value) {
  if (col.format) return col.format(value);
  const one = (v) => {
    const s = String(v ?? "");
    const bare = s.includes("::") ? s.split("::").pop() : s;
    const found = col.labels?.find((l) => l.value === bare || l.label === bare);
    return found ? found.label : bare;
  };
  if (Array.isArray(value)) return value.map(one).join(", ");
  return one(value);
}

const CHIP_KEYS = new Set(["status", "severity", "resolution"]);

function CellDisplay({ col, value }) {
  if (value == null || value === "") return <span style={{ color: INK, opacity: 0.3 }}>—</span>;
  if (col.type === "select" && CHIP_KEYS.has(col.key)) {
    const label = displayCellValue(col, value);
    const hot = ["high", "serious", "rejected"].includes(String(value));
    return (
      <span style={{ display: "inline-block", fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: hot ? "#A5544A" : BURG, background: hot ? "rgba(165,84,74,0.08)" : CREAM, border: "1px solid " + (hot ? "rgba(165,84,74,0.25)" : SOFT_BORDER), borderRadius: 99, padding: "2px 10px", whiteSpace: "nowrap" }}>
        {label}
      </span>
    );
  }
  if (col.type === "textarea") {
    return (
      <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "normal", lineHeight: 1.45 }}>
        {String(value)}
      </span>
    );
  }
  if (col.type === "csv") return <span>{displayCellValue(col, value)}</span>;
  if (col.type === "bool") return <span style={{ color: value ? "#2a7a2a" : INK, fontWeight: value ? 700 : 400 }}>{value ? "✓" : "—"}</span>;
  if (col.type === "date") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return <span>{String(value)}</span>;
    return <span>{d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>;
  }
  if (col.labels) {
    const found = col.labels.find((l) => l.value === value);
    if (found) return <span>{found.label}</span>;
  }
  return <span style={{ whiteSpace: "pre-wrap" }}>{String(value)}</span>;
}

function EditCell({ col, value, setValue, onCommit, onCancel }) {
  const inputBase = { width: "100%", padding: "4px 6px", border: "1px solid " + BURG, borderRadius: 4, fontFamily: F.sans, fontSize: 12, color: INK, outline: "none", boxSizing: "border-box" };
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    if (e.key === "Enter" && !e.shiftKey && col.type !== "textarea") { e.preventDefault(); onCommit(); }
  };
  if (col.type === "select") {
    return (
      <Combobox
        autoFocus
        value={value}
        onChange={(v) => setValue(v)}
        onCommit={(v) => onCommit(v)}
        onCancel={onCancel}
        options={col.options.map((opt) => ({ value: opt, label: col.labels?.find((l) => l.value === opt)?.label ?? (opt === "" ? "—" : opt) }))}
        style={{ padding: "4px 8px", fontSize: 12 }}
        panelWidth={200}
      />
    );
  }
  if (col.type === "bool") {
    return (
      <input autoFocus type="checkbox" checked={!!value} onChange={(e) => setValue(e.target.checked)} onBlur={onCommit} onKeyDown={onKey} />
    );
  }
  if (col.type === "textarea") {
    return (
      <textarea autoFocus value={value ?? ""} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} rows={3} style={{ ...inputBase, resize: "vertical", minHeight: 60 }} />
    );
  }
  if (col.type === "date") {
    return (
      <input autoFocus type="date" value={value ?? ""} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={inputBase} />
    );
  }
  return (
    <input autoFocus type="text" value={value ?? ""} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={inputBase} />
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────

// Sun-Sat is the team's reporting cadence. Default the report to the
// CURRENT week — the most recent Sunday through today. So Wednesday at
// noon shows Sun → Wed, Saturday shows Sun → Sat (full week), and
// Sunday morning shows just Sunday (the week starting today).
function currentWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const lastSun = new Date(today);
  lastSun.setDate(today.getDate() - day);
  // Local-date YYYY-MM-DD. Using toISOString() here would shift to UTC,
  // showing "yesterday" for users east of UTC (AU sees the 8th when it's
  // really the 9th locally).
  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { from: ymd(lastSun), to: ymd(today) };
}

function fmtWeekLabel(fromStr, toStr) {
  const f = new Date(fromStr);
  const t = new Date(toStr);
  const sameMonth = f.getMonth() === t.getMonth();
  const opts = { month: "short", day: "numeric" };
  if (sameMonth) {
    return `${f.toLocaleDateString("en-US", opts)} – ${t.getDate()}, ${t.getFullYear()}`;
  }
  return `${f.toLocaleDateString("en-US", opts)} – ${t.toLocaleDateString("en-US", opts)}, ${t.getFullYear()}`;
}

function ReportsTab({ role }) {
  const canView = role && ["Lead Agent","Manager","Admin","Owner"].includes(role);
  if (!canView) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 600, marginBottom: 14 }}>Reports</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6 }}>
            Reports are visible to Lead Agent and above. Ask your lead if you need a copy of the latest summary.
          </div>
        </div>
      </div>
    );
  }
  const canSeeImpact = ["Manager", "Admin", "Owner"].includes(role);
  return <ReportsShell canSeeImpact={canSeeImpact} />;
}

const REPORTS_SUBTABS = ["Weekly Summary", "Impact", "Recovery", "Voice of Customer"];

function ReportsShell({ canSeeImpact }) {
  const [sub, setSub] = useState("Weekly Summary");
  const subtabs = REPORTS_SUBTABS.filter((t) => t !== "Impact" || canSeeImpact);
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      {subtabs.length > 1 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 0", display: "flex", gap: 8 }}>
          {subtabs.map((t) => {
            const active = t === sub;
            return (
              <button key={t} onClick={() => setSub(t)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px",
                letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
              }}>{t}</button>
            );
          })}
        </div>
      )}
      {sub === "Weekly Summary" && <WeeklySummaryView />}
      {sub === "Impact" && <LedgerView />}
      {sub === "Recovery" && <RecoveryView />}
      {sub === "Voice of Customer" && <VoCView />}
    </div>
  );
}

const STAKEHOLDERS_KEY = "luma_report_stakeholders_v1";
const REPORT_RANGE_KEY = "luma_report_range_v1";

function readSavedRange() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REPORT_RANGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.from && parsed?.to) return parsed;
  } catch {}
  return null;
}

// 5.8 — proof the Hub reaches out: what lands in the inbox Monday 7am.
function WeeklyDigestPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid " + SOFT_BORDER, borderRadius: 12, background: W, overflow: "hidden", marginBottom: 20 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 10 }}>
        <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: BURG }}>Weekly digest — what lands in your inbox Monday 7am</span>
        <span style={{ color: GOLD, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "0 18px 16px" }}>
          <div style={{ border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: CREAM, padding: "10px 16px", fontFamily: F.sans, fontSize: 12, color: INK, borderBottom: "1px solid " + SOFT_BORDER }}>
              <div><strong style={{ color: BURG }}>From:</strong> LUMÉ CX Hub &lt;digest@cx.withluma.com.au&gt;</div>
              <div><strong style={{ color: BURG }}>To:</strong> you · <strong style={{ color: BURG }}>Every Monday, 7:00am</strong></div>
              <div><strong style={{ color: BURG }}>Subject:</strong> LUMÉ week in review — saves, refunds, and the one thing to fix</div>
            </div>
            <div style={{ padding: "14px 16px", fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.7 }}>
              <div style={{ fontFamily: F.serif, fontSize: 16, color: BURG, fontWeight: 600, marginBottom: 6 }}>Good morning — here's your week.</div>
              847 tickets · CSAT 4.60 · save rate 43% (up 6 points) · $4,610 returned by the Hub this week.<br />
              12 order issues logged, replacements out same-day on 80% of cases, and one Parcelline batch went out ({"AUD 445.30"}).<br />
              <strong style={{ color: BURG }}>The one thing to fix:</strong> tingling surprise on the Scalp Serum PDP — $1,120/month in avoidable refunds.
              <div style={{ marginTop: 10, fontFamily: F.serif, fontStyle: "italic", fontSize: 13, opacity: 0.65 }}>Compiled automatically by the Hub — 2 hours of manager time saved, receipted in the Value Ledger.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklySummaryView() {
  // Persist whatever date range the user last picked across reloads, so
  // they don't keep landing on a default that doesn't match what they
  // were just looking at. New users (or cleared localStorage) start on
  // the current week (Sun → today).
  const init = readSavedRange() ?? currentWeekRange();
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(REPORT_RANGE_KEY, JSON.stringify({ from, to }));
    }
  }, [from, to]);
  // Instant render: seed every section from the bundled demo data and
  // refresh silently — the report never shows a skeleton.
  const [gorgias, setGorgias] = useState(DEMO_SUMMARY);
  const [shop, setShop] = useState(DEMO_SHOPIFY);
  const [loop, setLoop] = useState(DEMO_LOOP);
  const [skio, setSkio] = useState(DEMO_SKIO);
  const [skioReasons, setSkioReasons] = useState(DEMO_SKIO_CANCEL_REASONS);
  // trends state removed May 17 — the /api/insights/trends fetch was
  // routinely timing out at 280s for week-long ranges and producing
  // "Took too long" errors in the report. Section dropped from both
  // the Reports UI and the stakeholder email below.
  const [issues, setIssues] = useState(() => issuesSeed());
  const [replacements, setReplacements] = useState(() => replacementsSeed());
  const [cancellations, setCancellations] = useState(() => cancellationsSeed());
  const [feedback, setFeedback] = useState(() => feedbackSeed());
  const [adverse, setAdverse] = useState(() => adverseReactionsSeed());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSend, setShowSend] = useState(false);
  // Free-text notes attached to this report window (from/to).
  // Persisted server-side via /api/report-notes — one row per (from, to).
  const [noteRecord, setNoteRecord] = useState(null); // server state
  const [noteDraft, setNoteDraft] = useState("");     // textarea text
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteJustSaved, setNoteJustSaved] = useState(false);
  const [noteError, setNoteError] = useState(null);

  // Fetch the notes for the current window. Re-runs whenever from/to
  // changes so the textarea reflects whichever week the user picks.
  async function fetchNotes() {
    setNoteError(null);
    try {
      const res = await fetch(`/api/report-notes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setNoteRecord(json.note);
      setNoteDraft(json.note?.body ?? "");
      setNoteJustSaved(false);
    } catch (e) {
      setNoteError(e.message);
    }
  }

  async function saveNotes() {
    setNoteSaving(true);
    setNoteError(null);
    setNoteJustSaved(false);
    try {
      const res = await fetch("/api/report-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, body: noteDraft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setNoteRecord(json.note);
      setNoteJustSaved(true);
      setTimeout(() => setNoteJustSaved(false), 1800);
    } catch (e) {
      setNoteError(e.message);
    } finally {
      setNoteSaving(false);
    }
  }

  useEffect(() => { fetchNotes(); }, [from, to]); // eslint-disable-line

  async function load() {
    setLoading(true);
    setErrors({});
    setGorgias(null); setShop(null); setLoop(null); setSkio(null);
    setSkioReasons(null);
    setIssues([]); setReplacements([]); setCancellations([]);
    setFeedback([]); setAdverse([]);
    // Anchor date ranges to AEST (UTC+10) — LUMÉ's Gorgias account
    // timezone. This way the same date range in the Hub matches the same
    // date range in Gorgias's dashboard, regardless of where the viewer
    // is sitting. HKT doesn't observe DST so +08:00 is always correct.
    const fromIso = new Date(from + "T00:00:00+08:00").toISOString();
    const toIso   = new Date(to   + "T23:59:59+08:00").toISOString();
    // Each fetch updates state independently — fast sources render first
    // while slow ones (gorgias summary, trends, skio cancel reasons) fill
    // in as they arrive.
    // Per-fetch timeout via AbortController. Without this, one hanging
    // upstream (e.g. Gorgias under 429 backoff) blocks Promise.allSettled
    // forever and leaves the "Loading…" button permanently stuck — caught
    // on 2026-05-15 when Gorgias was rate-limited.
    //
    // Default 90s is generous for the fast endpoints (Shopify, Skio, Loop,
    // logs). Heavy endpoints get bumped via FETCH_TIMEOUT_OVERRIDES:
    //   - trends: Claude inference + Gorgias message-by-message fetches
    //     on a weekly window can legitimately take 2-4 minutes. The
    //     server-side maxDuration is 300s; we sit just under that.
    //   - gorgias summary: paginates the entire Gorgias ticket list for
    //     the window. On heavier weeks (5-10k tickets across all
    //     the account) this needs 2-3 minutes.
    const FETCH_TIMEOUT_MS = 90_000;
    const FETCH_TIMEOUT_OVERRIDES = {
      trends:  280_000, // 4 min 40 sec — server maxDuration is 300s
      gorgias: 180_000, // 3 min — heavy Gorgias pagination on weekly windows
    };
    const fire = async (url, key, setter) => {
      const ac = new AbortController();
      const timeoutMs = FETCH_TIMEOUT_OVERRIDES[key] ?? FETCH_TIMEOUT_MS;
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: ac.signal });
        // Read as text first so a non-JSON response (e.g. HTML 504 page
        // from the proxy when a route times out) gives us a clean error
        // instead of a cryptic "Unexpected token '<'" parse failure.
        const raw = await res.text();
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch { /* not JSON */ }
        if (!res.ok || !json) {
          if (res.status === 504 || res.status === 502 || res.status === 429 || (!json && raw.startsWith("<"))) {
            throw new Error(res.status === 429 ? "Rate-limited — try again in a minute." : "Timed out — try a shorter date range or refresh.");
          }
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        setter(json);
      } catch (e) {
        const msg = e.name === "AbortError"
          ? `Took too long (>${Math.round(timeoutMs / 1000)}s) — try a shorter date range or refresh.`
          : e.message;
        setErrors((cur) => ({ ...cur, [key]: msg }));
      } finally {
        clearTimeout(timer);
      }
    };
    const rows = (setter) => (j) => setter(j?.rows ?? []);
    await Promise.allSettled([
      fire(`/api/insights/summary?from=${fromIso}&to=${toIso}`,           "gorgias",       setGorgias),
      fire(`/api/insights/shopify?from=${fromIso}&to=${toIso}`,           "shop",          setShop),
      fire(`/api/insights/loop?from=${fromIso}&to=${toIso}`,              "loop",          setLoop),
      fire(`/api/insights/skio?from=${fromIso}&to=${toIso}`,              "skio",          setSkio),
      fire(`/api/insights/skio/cancel-reasons?from=${fromIso}&to=${toIso}`,"skioReasons",  setSkioReasons),
      // /api/insights/trends call removed May 17 — see trends-state
      // comment above. Endpoint left intact in case we want to bring
      // the section back once Gorgias caching improves.
      fire(`/api/logs/issues?from=${fromIso}&to=${toIso}&limit=500`,           "issues",       rows(setIssues)),
      fire(`/api/logs/replacements?from=${fromIso}&to=${toIso}&limit=500`,     "replacements", rows(setReplacements)),
      fire(`/api/logs/cancellations?from=${fromIso}&to=${toIso}&limit=500`,    "cancellations",rows(setCancellations)),
      fire(`/api/logs/feedback?from=${fromIso}&to=${toIso}&limit=500`,         "feedback",     rows(setFeedback)),
      fire(`/api/logs/adverse-reactions?from=${fromIso}&to=${toIso}&limit=500`,"adverse",      rows(setAdverse)),
    ]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // ── derived aggregates ──────────────────────────────────────────
  const feedbackSuggestions = feedback
    .filter((r) => r.suggestion && r.suggestion.trim().length > 0)
    .slice(0, 6);
  const reportData = {
    weekLabel: fmtWeekLabel(from, to),
    gorgias,
    shop,
    refunds: loop,
    skio,
    skioReasons,
    // trends/trendsSampleSize/trendsReadAll removed May 17 — see
    // trends-state comment above for the rationale.
    issuesByWarehouse: groupCount(issues, (r) => r.warehouse || warehouseFromCountry(r.country)),
    issuesByCategory:  groupCount(issues, (r) => prettyEnum(r.category, ISSUE_CATEGORIES)),
    replacementsByReason:    groupCount(
      replacements.flatMap((r) => (r.reasonMains?.length ? r.reasonMains : [r.reason]).filter(Boolean).map((m) => ({ reasonKey: m }))),
      (r) => prettyEnum(r.reasonKey, REPLACEMENT_REASONS)
    ),
    replacementsByWarehouse: groupCount(replacements, (r) => r.warehouse || warehouseFromCountry(r.country)),
    cancellationReasons: groupCount(cancellations, (r) => prettyEnum(r.cancellationType, CANCELLATION_TYPES)),
    feedbackByTheme:     groupCount(feedback, (r) => prettyEnum(r.theme, FEEDBACK_THEMES)),
    feedbackSamples:     feedback.slice(0, 6),
    feedbackSuggestions,
    adverseCount: adverse.length,
    adverseSerious: adverse.filter((r) => r.isSerious).length,
    issuesAll: issues,
    notes: noteRecord?.body ?? noteDraft ?? "",
    notesEditedByName: noteRecord?.editedByName ?? null,
    notesUpdatedAt: noteRecord?.updatedAt ?? null,
  };

  const sectionLabel = { fontFamily: F.sans, fontSize: 11, color: BURG, textTransform: "uppercase", letterSpacing: 4, fontWeight: 700, marginBottom: 14 };
  const sectionGap = { marginBottom: 24 };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>LUMÉ HAIR Hub</div>
            <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05, letterSpacing: -0.5 }}>Weekly Summary</div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 18, color: INK, opacity: 0.65, marginTop: 6 }}>{reportData.weekLabel}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.55, marginTop: 10, lineHeight: 1.5, maxWidth: 540 }}>Compiled from Gorgias, Shopify, and Skio. Use this to spot trends, brief stakeholders, and flag anything that needs attention before the week closes.</div>
            <div style={{ marginTop: 14, maxWidth: 640 }}><WeeklyDigestPreview /></div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: "6px 10px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12 }} />
            <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.5 }}>to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: "6px 10px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12 }} />
            <button onClick={load} disabled={loading} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: loading ? "wait" : "pointer", borderRadius: 99, opacity: loading ? 0.5 : 1 }}>Refresh</button>
            <button onClick={() => setShowSend(true)} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Send to Stakeholders</button>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Key metrics</div>
          <KeyMetricsBlock gorgias={gorgias} shop={shop} loop={loop} skio={skio} errors={errors} />
        </div>

        {/* Trustpilot — lifetime rating + distribution. Values
            entered by hand (no API integration). */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Trustpilot</div>
          <TrustpilotReportSection />
        </div>

        {/* Refunds */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Refunds</div>
          {errors.loop && <ErrorLine text={errors.loop} />}
          {loop && <RefundsSummaryBlock loop={loop} shop={shop} />}
        </div>

        {/* Subscriptions */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Subscriptions (Skio)</div>
          {errors.skio && <ErrorLine text={errors.skio} />}
          {skio && <SkioSummaryBlock skio={skio} />}
          {(skioReasons?.topCancelReasons ?? []).length > 0 && (
            <div style={{ marginTop: 14, background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                Cancellation reasons — customer-selected
                {skioReasons.totalCancelled ? <span style={{ opacity: 0.5, fontWeight: 500, marginLeft: 8 }}>· {skioReasons.totalCancelled.toLocaleString()} sessions</span> : null}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 13 }}>
                <tbody>
                  {skioReasons.topCancelReasons.map((r, i) => {
                    const pct = skioReasons.totalCancelled ? Math.round((r.count / skioReasons.totalCancelled) * 100) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: i < skioReasons.topCancelReasons.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
                        <td style={{ padding: "8px 0", color: INK }}>{r.reason}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: BURG, fontWeight: 700, whiteSpace: "nowrap" }}>{r.count.toLocaleString()} <span style={{ color: INK, opacity: 0.4, fontSize: 11, fontWeight: 500 }}>({pct}%)</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Issues */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Order issues by warehouse</div>
          {issues.length === 0 ? <EmptyLine text="No issues logged this week." />
            : <IssuesByWarehouseBlock issues={issues} byWarehouse={reportData.issuesByWarehouse} byCategory={reportData.issuesByCategory} />}
        </div>

        {/* Replacements */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Replacements</div>
          {replacements.length === 0 ? <EmptyLine text="No replacements logged this week." />
            : (
              <CompactSummary
                count={replacements.length}
                noun="replacement"
                breakdowns={[
                  { label: "Reason", entries: reportData.replacementsByReason },
                  { label: "Warehouse", entries: reportData.replacementsByWarehouse },
                ]}
              />
            )}
        </div>

        {/* Adverse Reactions / Reaction-Concern */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Reaction / Concern</div>
          {reportData.adverseCount === 0 ? (
            <EmptyLine text="No adverse reactions filed this week." />
          ) : (
            <div style={{ background: W, border: "1px solid " + (reportData.adverseSerious > 0 ? RED : SOFT_BORDER), borderLeft: "3px solid " + (reportData.adverseSerious > 0 ? RED : GOLD), borderRadius: 10, padding: "16px 20px", fontFamily: F.sans, fontSize: 14, color: INK }}>
              <strong style={{ color: BURG }}>{reportData.adverseCount}</strong> filed
              {reportData.adverseSerious > 0 && <> · <strong style={{ color: RED }}>{reportData.adverseSerious} serious (SAE)</strong></>}
              <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginTop: 6 }}>See Logs → Reaction/Concern for full records.</div>
            </div>
          )}
        </div>

        {/* Top Trends */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Top Trends</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { rank: 1, theme: "Scalp Serum tingling queries", count: 89, note: "Customers are alarmed by the tingling sensation on first use. The product page disclaimer is not prominent enough — recommend adding an inline callout to the PDP." },
              { rank: 2, theme: "Repair Serum results timeline", count: 67, note: "Customers at weeks 2–4 expecting visible results. Education content needed at the 3-week mark — suggested send: 'Your hair journey — what to expect in week 3'." },
              { rank: 3, theme: "Hair Edit swap requests", count: 44, note: "Customers wanting to change which serums come in their next box. This is now possible via Skio — agents should offer the swap proactively on save plays." },
            ].map((t) => (
              <div key={t.rank} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: GOLD, lineHeight: 1, minWidth: 32 }}>{t.rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 14, color: BURG, marginBottom: 4 }}>{t.theme} <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.45, fontWeight: 500 }}>· {t.count} mentions</span></div>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, lineHeight: 1.55 }}>{t.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice of Customer */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Voice of Customer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            {[
              { label: "Positive", count: 18, pct: 56, color: "#3B7A4F" },
              { label: "Constructive", count: 9, pct: 28, color: GOLD },
              { label: "Feature Request", count: 5, pct: 16, color: BURG },
            ].map((s) => (
              <div key={s.label} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: BURG, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.5, marginTop: 4 }}>{s.pct}% of logged feedback</div>
              </div>
            ))}
          </div>
          {/* Themes + recent samples — always show faux data for demo */}
          <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: BURG, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Themes</div>
              {[
                { theme: "Product results / timeline", count: 11 },
                { theme: "Scalp Serum tingling experience", count: 7 },
                { theme: "Subscription / Hair Edit", count: 5 },
                { theme: "Packaging & unboxing", count: 4 },
                { theme: "Shipping speed", count: 3 },
                { theme: "Product scent / texture", count: 2 },
              ].map((t, i, arr) => (
                <div key={t.theme} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 13 }}>
                  <span style={{ color: BURG, fontWeight: 500 }}>{t.theme}</span>
                  <span style={{ color: BURG, fontWeight: 700 }}>{t.count}</span>
                </div>
              ))}
            </div>
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: BURG, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Recent Samples</div>
              {[
                { name: "Georgia W.", country: "AU", note: "Hair is completely transformed after 6 weeks of Repair Serum. Sharing her story everywhere." },
                { name: "Liam O.", country: "GB", note: "Scalp Serum tingling wasn't explained clearly on the product page — felt alarmed the first time." },
                { name: "Fatima A.", country: "US", note: "Requesting travel-size versions of Smooth and Glow — can't take full bottles on flights." },
                { name: "Zoe A.", country: "AU", note: "Recommended LUMÉ to 4 friends after Glow Serum results. Referral code sent." },
              ].map((s, i, arr) => (
                <div key={s.name} style={{ padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 2 }}>
                    <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: BURG }}>{s.name}</span>
                    <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.45 }}>{s.country}</span>
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.45 }}>{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes — free-text, per-window, persisted in Postgres
            (ReportNote model). Anything typed here gets included in
            the stakeholder email when "Send to Stakeholders" is hit. */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Notes</div>
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px" }}>
            <textarea
              value={noteDraft}
              onChange={(e) => { setNoteDraft(e.target.value); setNoteJustSaved(false); }}
              placeholder={"Anything worth flagging this week — e.g.\n• 2 x 1-star Trustpilot reviews about Scalp Serum\n• New batch of Hair Edit boxes arriving Thursday\n• Team catch-up Friday 10am"}
              rows={8}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: F.sans, fontSize: 14, color: INK, lineHeight: 1.55,
                background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
                padding: "12px 14px", resize: "vertical", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = BURG)}
              onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <button
                onClick={saveNotes}
                disabled={noteSaving || noteDraft === (noteRecord?.body ?? "")}
                style={{
                  background: BURG, color: CREAM, border: "1px solid " + BURG,
                  fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px",
                  letterSpacing: 1.5, textTransform: "uppercase",
                  cursor: noteSaving ? "wait" : "pointer", borderRadius: 99,
                  opacity: (noteSaving || noteDraft === (noteRecord?.body ?? "")) ? 0.5 : 1,
                }}
              >{noteSaving ? "Saving…" : noteJustSaved ? "Saved ✓" : "Save notes"}</button>
              {noteRecord?.editedByName && noteRecord?.updatedAt && (
                <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>
                  Last edited by {noteRecord.editedByName} · {new Date(noteRecord.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
              {noteError && (
                <span style={{ fontFamily: F.sans, fontSize: 11, color: RED }}>
                  {noteError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSend && (
        <SendToStakeholdersModal
          report={reportData}
          fromDate={from}
          toDate={to}
          onClose={() => setShowSend(false)}
        />
      )}
    </div>
  );
}

// ── small render helpers ──────────────────────────────────────────

function prettyEnum(value, mapList) {
  // Values may be stored as the option value OR already as the display
  // label (seed data stores labels for free-form reason fields) — both
  // resolve to the label so grouping and rendering stay consistent.
  const found = mapList?.find((m) => m.value === value || m.label === value);
  if (found) return found.label;
  // Fallback: kebab-case → Title Case
  return String(value || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupCount(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));
}

function ErrorLine({ text }) {
  return <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 10, borderRadius: 8, fontFamily: F.sans, fontSize: 12 }}>{text}</div>;
}
function EmptyLine({ text }) {
  return <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5, padding: "8px 0" }}>{text}</div>;
}

// Static Trustpilot block used in the weekly report. Shows the lifetime
// rating + total + per-star percentage breakdown. All data is
// hand-entered — see TRUSTPILOT_STATS at the top of this file for how
// to refresh.
function TrustpilotReportSection() {
  const dist = TRUSTPILOT_STATS.distribution;
  const stars = [
    { n: 5, pct: dist.fiveStar, color: "#3B7A4F" },
    { n: 4, pct: dist.fourStar, color: "#3B7A4F" },
    { n: 3, pct: dist.threeStar, color: GOLD },
    { n: 2, pct: dist.twoStar, color: RED },
    { n: 1, pct: dist.oneStar, color: RED },
  ];

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px" }}>
      {/* Headline */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 700, lineHeight: 1 }}>
          {TRUSTPILOT_STATS.trustScore.toFixed(1)}
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7 }}>
          out of 5 · {TRUSTPILOT_STATS.totalReviews.toLocaleString()} reviews
        </div>
        <a
          href={TRUSTPILOT_STATS.url}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: "auto", fontFamily: F.sans, fontSize: 11, color: BURG, textDecoration: "underline", opacity: 0.8 }}
        >
          View on Trustpilot ↗
        </a>
      </div>

      {/* Distribution bars */}
      <div>
        {stars.map(({ n, pct, color }) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <span style={{ width: 56, color: color, fontWeight: 700 }}>{tpRenderStars(n)}</span>
            <div style={{ flex: 1, height: 10, background: CREAM, borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`,
                height: "100%",
                background: color,
                opacity: 0.85,
              }} />
            </div>
            <span style={{ width: 40, textAlign: "right", color: BURG, fontWeight: 700 }}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefundsSummaryBlock({ loop, shop }) {
  const ROWS = [
    { key: "Monthly",    label: "Hair Edit (monthly)" },
    { key: "Bimonthly",  label: "Skip-month / bi-monthly" },
    { key: "Refills",    label: "Renewal orders" },
    { key: "OTP",        label: "One-time purchases" },
  ];
  const m = loop?.matrix ?? {};
  const directCount = shop?.refunded != null && loop?.count != null
    ? Math.max(0, shop.refunded - loop.count)
    : null;
  const directAmount = shop?.refundAmount != null && loop?.total != null
    ? Math.max(0, shop.refundAmount - loop.total)
    : null;
  const totalCount = shop?.refunded ?? loop?.count ?? 0;
  const totalAmount = shop?.refundAmount ?? loop?.total ?? 0;

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px" }}>
      <div style={{ fontFamily: F.serif, fontSize: 28, color: BURG, fontWeight: 700 }}>
        {formatMoney(totalAmount)} <span style={{ fontSize: 16, color: INK, opacity: 0.55, fontWeight: 500 }}>· {totalCount.toLocaleString()} refunds</span>
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginBottom: directCount != null && directCount > 0 && directAmount === 0 ? 6 : 16 }}>
        {loop?.count ?? 0} customer-initiated ({formatMoney(loop?.total)}){directCount != null ? ` · ${directCount.toLocaleString()} direct in Shopify (${formatMoney(directAmount)})` : ""}
      </div>
      {/* Same $0-direct-cases disclaimer as the Insights tab — see
          LoopRefundsCard for full context. */}
      {directCount != null && directCount > 0 && directAmount === 0 && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.55, marginBottom: 16, maxWidth: 720, lineHeight: 1.4 }}>
          Some Shopify "refund" events recorded with $0 — typically orders cancelled due to payment failure, store-credit refunds, or foreign-currency refunds (where Shopify doesn't return a USD-normalised amount). Counted as cases but not added to the dollar total.
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12 }}>
        <thead>
          <tr style={{ background: CREAM }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600 }}>Category</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Cases</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Total $</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => {
            const c = m[r.key] ?? { count: 0, amount: 0 };
            return (
              <tr key={r.key} style={{ background: i % 2 === 0 ? W : "#fdfbf9" }}>
                <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600 }}>{r.label}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{c.count}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(c.amount)}</td>
              </tr>
            );
          })}
          {directCount != null && (
            <tr style={{ background: "#fdfbf9" }}>
              <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600, fontStyle: "italic" }}>Processed directly in Shopify</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{directCount}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(directAmount)}</td>
            </tr>
          )}
          {shop?.refunded != null && (
            <tr style={{ background: BURG, color: CREAM }}>
              <td style={{ padding: "10px 12px", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontSize: 11 }}>Total (all sources)</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{shop.refunded.toLocaleString()}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: GOLD }}>{formatMoney(totalAmount)}</td>
            </tr>
          )}
        </tbody>
      </table>
      {(loop?.topReasons ?? []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Refund reasons</div>
          <HBarList entries={loop.topReasons.map((r) => ({ key: r.reason, count: r.count }))} total={loop.count} labelWidth={220} />
        </div>
      )}
      {(loop?.topReasons ?? []).length > 0 && (
        <div style={{ marginTop: 16, background: CREAM, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Top 3 refund reasons (from Loop)</div>
          {loop.topReasons.map((rr, j) => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontSize: 13, color: INK, padding: "2px 0" }}>
              <span>{rr.reason}</span>
              <span style={{ color: BURG, fontWeight: 700 }}>{rr.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Loop Returns operations summary — submitted volume, processed %,
// state breakdown, labels generated, handling fees, and the keep-item
// (refund-before-inspection) share. Pulls from /api/insights/loop's new
// `operations` payload (added 2026-05-15). Numbers won't exactly match
// Loop dashboard's "Last week" view — it uses a different (undisclosed)
// window definition; we use the report's Sun→today window for internal
// consistency with the rest of the weekly summary.
function LoopOperationsBlock({ loop }) {
  const ops = loop?.operations;
  if (!ops || ops.submitted === 0) {
    return (
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
        No Loop returns in this window.
      </div>
    );
  }

  const tile = (label, value, hint) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const pct = (n, d) => d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : "—";
  const unprocessed = ops.submitted - ops.processed;
  const open = ops.byState?.open ?? 0;
  const cancelled = ops.byState?.cancelled ?? 0;

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px" }}>
      {/* Headline */}
      <div style={{ fontFamily: F.serif, fontSize: 28, color: BURG, fontWeight: 700 }}>
        {ops.submitted.toLocaleString()} <span style={{ fontSize: 16, color: INK, opacity: 0.55, fontWeight: 500 }}>returns submitted</span>
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginBottom: 16 }}>
        {ops.processed.toLocaleString()} fully processed ({pct(ops.processed, ops.submitted)}) ·
        {" "}{unprocessed.toLocaleString()} remaining
        {unprocessed > 0 && (open > 0 || cancelled > 0)
          ? ` (${open > 0 ? `${open} awaiting return shipment` : ""}${open > 0 && cancelled > 0 ? ", " : ""}${cancelled > 0 ? `${cancelled} cancelled / abandoned` : ""})`
          : ""}
      </div>

      {/* Tile row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
        {tile("Submitted", ops.submitted.toLocaleString(), "in window")}
        {tile("Processed", ops.processed.toLocaleString(), pct(ops.processed, ops.submitted) + " of submitted")}
        {tile("Awaiting ship-back", open.toLocaleString(), "state = open")}
        {tile("Cancelled / abandoned", cancelled.toLocaleString(), "did not complete")}
        {tile("Labels generated", ops.labelsGenerated.toLocaleString(), pct(ops.labelsGenerated, ops.submitted) + " of submitted")}
        {tile("Handling fees", formatMoney(ops.handlingFeesTotal), "across all returns · customer-paid vs LUMÉ-paid split TBC with Loop")}
      </div>

      {/* Keep-item / return-required ROI line — Cherie's policy comparison.
          Keep-item = returns where no label was generated AND not cancelled
          (i.e. customer got refunded without shipping anything back). The
          three buckets (keep-item, labels generated, cancelled) sum to total
          submitted — the tile row above shows each one separately. */}
      {ops.keepItemCount > 0 && (
        <div style={{ background: CREAM, borderRadius: 8, padding: "10px 14px", fontFamily: F.sans, fontSize: 12, color: INK }}>
          <span style={{ color: BURG, fontWeight: 700 }}>{ops.keepItemCount.toLocaleString()}</span> of {ops.submitted.toLocaleString()} returns
          ({pct(ops.keepItemCount, ops.submitted)}) were processed under the <strong>keep-item</strong> policy —
          refunded without requiring return shipment. The remaining {ops.labelsGenerated.toLocaleString()} had labels generated for return
          {(ops.byState?.cancelled ?? 0) > 0 ? `, and ${ops.byState.cancelled} were cancelled / abandoned` : ""}.
        </div>
      )}

      <div style={{ marginTop: 10, fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.45 }}>
        Loop costs split (customer-covered vs LUMÉ-covered) to be confirmed with Loop. Tracking for return-required policy ROI vs keep-item approach.
      </div>
    </div>
  );
}

function SkioSummaryBlock({ skio }) {
  const tile = (label, value, hint) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      {tile("Active subs", skio?.active != null ? skio.active.toLocaleString() : "—", skio?.paused != null ? `${skio.paused.toLocaleString()} paused` : null)}
      {tile("Churn rate", skio?.churnRate != null ? `${(skio.churnRate * 100).toFixed(2)}%` : "—", skio?.activeAtStart ? `${skio.cancelled} of ${skio.activeAtStart.toLocaleString()} at start` : null)}
      {tile("Cancellations", skio?.cancelled?.toLocaleString() ?? "—", "in range")}
      {tile("New subs", skio?.created?.toLocaleString() ?? "—", skio?.netChange != null ? `${skio.netChange >= 0 ? "+" : ""}${skio.netChange.toLocaleString()} net` : null)}
      {tile("Failed payments", skio?.failedPayments?.toLocaleString() ?? "—", "in range")}
    </div>
  );
}

function CountBreakdown({ entries, total }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px" }}>
      {entries.map((e) => {
        const pct = total ? Math.round((e.count / total) * 100) : 0;
        return (
          <div key={e.key} style={{ padding: "6px 0", borderBottom: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 13, color: INK }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: BURG, fontWeight: 600 }}>{e.key}</span>
              <span style={{ color: BURG, fontWeight: 700 }}>{e.count} <span style={{ color: INK, opacity: 0.4, fontSize: 11, fontWeight: 500 }}>({pct}%)</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CountCard({ title, entries, total }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "11px 14px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      <HBarList entries={entries.slice(0, 8)} total={total} labelWidth={150} />
    </div>
  );
}

function IssuesByWarehouseBlock({ issues, byWarehouse, byCategory }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <CompactSummary
        count={issues.length}
        noun="order issue"
        breakdowns={[
          { label: "Warehouse", entries: byWarehouse },
          { label: "Category",  entries: byCategory },
        ]}
        footer={
          <button onClick={() => setOpen((o) => !o)} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: BURG, padding: "6px 14px", letterSpacing: 1.5, textTransform: "uppercase", borderRadius: 99, cursor: "pointer", marginTop: 12 }}>
            {open ? "Hide" : "Show"} per-ticket detail
          </button>
        }
      />
      {open && (
        <div style={{ marginTop: 8, background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 18px" }}>
          {issues.map((r, i) => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: i < issues.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 12, color: INK }}>
              <strong style={{ color: BURG }}>{r.orderId}</strong>
              <span style={{ color: INK, opacity: 0.6 }}> — {prettyEnum(r.category, ISSUE_CATEGORIES)}{r.warehouse ? " · " + r.warehouse : ""}</span>
              <div style={{ marginTop: 2 }}>{r.description}</div>
              {r.itemsAffected?.length > 0 && <div style={{ opacity: 0.55, fontSize: 11, marginTop: 2 }}>Items: {r.itemsAffected.join(", ")}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact summary block used by Order Issues / Replacements / etc.
// Renders headline count + each breakdown as a single line of pill chips.
// Reads cleanly whether there's 1 entry or 50.
function CompactSummary({ count, noun, breakdowns, footer }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700, marginBottom: breakdowns.length ? 12 : 0 }}>
        {count.toLocaleString()} <span style={{ fontSize: 14, color: INK, opacity: 0.55, fontWeight: 500 }}>{noun}{count === 1 ? "" : "s"} this week</span>
      </div>
      {breakdowns.map(({ label, entries }, i) => (
        entries.length > 0 && (
          <div key={i} style={{ padding: "6px 0" }}>
            <div style={{ color: INK, opacity: 0.55, letterSpacing: 1, textTransform: "uppercase", fontSize: 10, fontWeight: 700, fontFamily: F.sans, marginBottom: 6 }}>{label}</div>
            <HBarList entries={entries.slice(0, 8)} total={count} labelWidth={160} />
            {entries.length > 8 && (
              <div style={{ color: INK, opacity: 0.5, fontSize: 11, fontFamily: F.sans, marginTop: 4 }}>+{entries.length - 8} more</div>
            )}
          </div>
        )
      ))}
      {footer}
    </div>
  );
}

function KeyMetricsBlock({ gorgias, shop, loop, skio, errors }) {
  const tile = (label, value, hint, accent, trend) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "10px 13px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
        <div style={{ fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
        {trend && <DeltaChip delta={trend.delta} good={trend.good} />}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: accent || BURG, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        {trend && <Sparkline data={trend.series} width={58} height={20} />}
      </div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, marginTop: 4 }}>{hint}</div>}
    </div>
  );
  const num = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString();
  const pct = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;
  const dur = (s) => formatDuration(s);

  // Refunds + rate sourced from Shopify (system of record across Loop and
  // direct-Shopify refunds — Loop processes through Shopify's API so
  // Shopify's totals already include Loop-initiated refunds). Loop's own
  // count is the *subset* of refunds that originated via the Loop portal;
  // we surface the breakdown in the hint so it's obvious the headline
  // number is combined, not Loop-only.
  const totalRefunds = shop?.refunded;
  const directShopify = shop?.refunded != null && loop?.count != null
    ? Math.max(0, shop.refunded - loop.count)
    : null;

  // Compose the refunds-tile hint to ALWAYS surface both the $ total and
  // the Loop/direct split when both are available. Previously the hint
  // showed either $ or split — never both — which made "Refunds: 52"
  // ambiguous (Cherie May 18: easy to read as Loop-only).
  const refundHintParts = [];
  if (shop?.refundAmount != null) refundHintParts.push(formatMoney(shop.refundAmount));
  if (loop?.count != null && directShopify != null) {
    refundHintParts.push(`${num(loop.count)} customer-initiated + ${num(directShopify)} direct`);
  }
  const refundHint = refundHintParts.length ? refundHintParts.join(" · ") : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
      {tile("Tickets", num(gorgias?.volume), gorgias?.volume != null ? `${num(gorgias.volume)} in range` : null, null, DEMO_TREND.tickets)}
      {tile("Open", num(gorgias?.byStatus?.open), null, null, DEMO_TREND.open)}
      {tile("Closed", num(gorgias?.byStatus?.closed), null, null, DEMO_TREND.closed)}
      {tile("CSAT", gorgias?.csat?.average != null ? gorgias.csat.average.toFixed(2) : "—", gorgias?.csat?.count ? `${gorgias.csat.count} responses` : null, null, DEMO_TREND.csat)}
      {tile("Resolution", dur(gorgias?.resolution?.avgSeconds), gorgias?.resolution?.count ? `${gorgias.resolution.count} closed` : null, null, DEMO_TREND.resolution)}
      {tile("Msgs / ticket", gorgias?.mpt?.average != null ? gorgias.mpt.average.toFixed(1) : "—", null, null, DEMO_TREND.mpt)}
      {tile("Orders", num(shop?.orders), null, null, DEMO_TREND.orders)}
      {tile("Refunds", num(totalRefunds), refundHint, null, DEMO_TREND.refunds)}
      {tile(
        "Refund rate ($)",
        pct(shop?.refundRateDollars ?? shop?.refundRate),
        shop?.refundRate != null ? `${(shop.refundRate * 100).toFixed(2)}% by count` : null,
        null,
        DEMO_TREND.refundRate
      )}
      {tile("Active subs", num(skio?.active), skio?.paused != null ? `${num(skio.paused)} paused` : null, null, DEMO_TREND.activeSubs)}
      {tile("Cancellations", num(skio?.cancelled), "in range", null, DEMO_TREND.cancelledSubs)}
      {tile("Churn rate", pct(skio?.churnRate), null, null, DEMO_TREND.churnRate)}
    </div>
  );
}

function TrendsBlock({ trends, sampleSize, totalTickets, readAll }) {
  if (!trends || trends.length === 0) {
    return <EmptyLine text="No trends found in this range." />;
  }
  return (
    <div style={{ background: "linear-gradient(160deg," + W + " 0%,#fbf6ef 100%)", border: "1px solid " + GOLD, borderRadius: 10, padding: "20px 24px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 700, marginBottom: 12 }}>
        🚨 3 trends to watch:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {trends.map((t, i) => <TrendItem key={i} index={i + 1} trend={t} />)}
      </div>
      {sampleSize ? (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, marginTop: 12 }}>
          {readAll
            ? `Read every customer message: ${sampleSize} of ${totalTickets ?? "?"} tickets — counts are exact.`
            : `Read ${sampleSize} customer messages of ${totalTickets ?? "?"} total — counts are estimated from the sample.`}
        </div>
      ) : null}
    </div>
  );
}

function CustomerInsightsBlock({ byTheme, samples, suggestions, total }) {
  return (
    <div>
      <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
        <CountCard title="Themes" entries={byTheme} total={total} />
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Recent samples</div>
          {samples.map((r) => (
            <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 12, color: INK }}>
              <div style={{ color: BURG, fontWeight: 600 }}>{prettyEnum(r.theme, FEEDBACK_THEMES)}{r.relatedTeam ? " · " + r.relatedTeam : ""}</div>
              <div style={{ marginTop: 2 }}>{r.details}</div>
            </div>
          ))}
        </div>
      </div>
      {suggestions.length > 0 && (
        <div style={{ background: CREAM, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Ways to improve (agent suggestions)</div>
          {suggestions.map((s) => (
            <div key={s.id} style={{ padding: "5px 0", fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5 }}>
              <span style={{ color: GOLD, fontWeight: 700, marginRight: 8 }}>→</span>
              <span>{s.suggestion}</span>
              <span style={{ color: INK, opacity: 0.5, fontSize: 11, marginLeft: 8 }}>— {prettyEnum(s.theme, FEEDBACK_THEMES)}{s.relatedTeam ? " / " + s.relatedTeam : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackBlock({ byTheme, samples, total }) {
  return (
    <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
      <CountCard title="By theme" entries={byTheme} total={total} />
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Recent samples</div>
        {samples.map((r) => (
          <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ color: BURG, fontWeight: 600 }}>{r.theme}{r.relatedTeam ? " · " + r.relatedTeam : ""}</div>
            <div style={{ marginTop: 2 }}>{r.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Send to Stakeholders modal ────────────────────────────────────

function buildPlainTextEmail(d) {
  const lines = [];
  const fmtNum = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString();
  const fmtPct = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;

  lines.push(`Hi team,`);
  lines.push(``);
  lines.push(`LUMÉ HAIR weekly summary —${d.weekLabel}.`);
  lines.push(``);

  // KEY METRICS
  lines.push(`KEY METRICS`);
  if (d.gorgias) {
    lines.push(`  Tickets: ${fmtNum(d.gorgias.volume)} (${fmtNum(d.gorgias.byStatus?.open)} open, ${fmtNum(d.gorgias.byStatus?.closed)} closed)`);
    if (d.gorgias.csat?.average != null) lines.push(`  CSAT: ${d.gorgias.csat.average.toFixed(2)} (${d.gorgias.csat.count} responses)`);
    if (d.gorgias.resolution?.avgSeconds != null) lines.push(`  Resolution time: ${formatDuration(d.gorgias.resolution.avgSeconds)}`);
    if (d.gorgias.mpt?.average != null) lines.push(`  Msgs / ticket: ${d.gorgias.mpt.average.toFixed(1)}`);
  }
  if (d.shop) lines.push(`  Orders: ${fmtNum(d.shop.orders)}`);
  if (d.refunds) {
    // $-rate first (gross-based, the standard ecommerce metric); count
    // rate as the secondary tag so volume planners can still see it.
    const dollarRate = d.shop?.refundRateDollars ?? null;
    const countRate = d.shop?.refundRate ?? (d.refunds.count && d.shop?.orders ? d.refunds.count / d.shop.orders : null);
    const rateBits = [];
    if (dollarRate != null) rateBits.push(`${fmtPct(dollarRate)} ($)`);
    if (countRate != null) rateBits.push(`${fmtPct(countRate)} by count`);
    const rateStr = rateBits.length ? ` · ${rateBits.join(" / ")}` : "";
    lines.push(`  Refunds: ${fmtNum(d.refunds.count)} (${formatMoney(d.refunds.total)})${rateStr}`);
  }
  if (d.skio) {
    lines.push(`  Active subs: ${fmtNum(d.skio.active)}${d.skio.paused != null ? ` (${fmtNum(d.skio.paused)} paused)` : ""}`);
    lines.push(`  Cancellations: ${fmtNum(d.skio.cancelled)} · Churn ${fmtPct(d.skio.churnRate)}`);
  }
  lines.push(``);

  if (d.refunds) {
    const totalRefunds = d.shop?.refunded ?? d.refunds.count ?? 0;
    const totalAmount = d.shop?.refundAmount ?? d.refunds.total ?? 0;
    const directCount = d.shop?.refunded != null && d.refunds?.count != null
      ? Math.max(0, d.shop.refunded - d.refunds.count) : null;
    const directAmount = d.shop?.refundAmount != null && d.refunds?.total != null
      ? Math.max(0, d.shop.refundAmount - d.refunds.total) : null;
    lines.push(`REFUNDS`);
    lines.push(`Total: ${formatMoney(totalAmount)} (${totalRefunds} cases${d.shop?.refundRate != null ? `, rate ${(d.shop.refundRate * 100).toFixed(2)}%` : ""})`);
    lines.push(`  · ${d.refunds.count ?? 0} customer-initiated (${formatMoney(d.refunds.total)})`);
    if (directCount != null) lines.push(`  · ${directCount} direct in Shopify (${formatMoney(directAmount)})`);
    const m = d.refunds.matrix ?? {};
    for (const k of ["Monthly","Bimonthly","Refills","OTP"]) {
      const c = m[k];
      if (c?.count) lines.push(`  · ${k}: ${c.count} cases / ${formatMoney(c.amount)}`);
    }
    if ((d.refunds.topReasons ?? []).length) {
      lines.push(`Top 3 reasons:`);
      d.refunds.topReasons.forEach((rr) => lines.push(`  · ${rr.reason} — ${rr.count}`));
    }
    lines.push(``);
  }
  if (d.skio) {
    lines.push(`SUBSCRIPTIONS (Skio)`);
    if (d.skio.active != null)        lines.push(`Active: ${d.skio.active.toLocaleString()}${d.skio.paused != null ? ` (${d.skio.paused.toLocaleString()} paused)` : ""}`);
    if (d.skio.churnRate != null)     lines.push(`Churn: ${(d.skio.churnRate * 100).toFixed(2)}%`);
    if (d.skio.cancelled != null)     lines.push(`Cancellations: ${d.skio.cancelled.toLocaleString()}`);
    if (d.skio.created != null)       lines.push(`New subs: ${d.skio.created.toLocaleString()}`);
    if (d.skio.failedPayments != null)lines.push(`Failed payments: ${d.skio.failedPayments.toLocaleString()}`);
    if ((d.skioReasons?.topCancelReasons ?? []).length > 0) {
      lines.push(`Cancellation reasons — customer-selected${d.skioReasons.totalCancelled ? ` (${d.skioReasons.totalCancelled.toLocaleString()} sessions)` : ""}:`);
      d.skioReasons.topCancelReasons.slice(0, 10).forEach((e) => lines.push(`  · ${e.reason}: ${e.count}`));
    }
    lines.push(``);
  }
  if (d.issuesAll?.length) {
    lines.push(`ORDER ISSUES (${d.issuesAll.length} this week)`);
    d.issuesByWarehouse.forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    lines.push(`Categories:`);
    d.issuesByCategory.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    lines.push(``);
  }
  if (d.replacementsByReason.length) {
    lines.push(`REPLACEMENTS`);
    lines.push(`By reason:`);
    d.replacementsByReason.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    if (d.replacementsByWarehouse.length) {
      lines.push(`By warehouse:`);
      d.replacementsByWarehouse.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    }
    lines.push(``);
  }
  if (d.adverseCount > 0) {
    lines.push(`ADVERSE REACTIONS`);
    lines.push(`${d.adverseCount} filed${d.adverseSerious > 0 ? ` (${d.adverseSerious} serious)` : ""}`);
    lines.push(``);
  }
  if ((d.trends ?? []).length) {
    lines.push(`TOP 3 TRENDS`);
    lines.push(`(3 trends to watch)`);
    lines.push(``);
    d.trends.forEach((t, i) => {
      const head = t.estTotal > 0
        ? `${i + 1}. ${t.title} — ~${t.estTotal.toLocaleString()} tickets${t.estPct > 0 ? ` (~${t.estPct}% of volume)` : ""}`
        : `${i + 1}. ${t.title}`;
      lines.push(head);
      (t.quotes ?? []).forEach((q, j) => {
        const tid = t.quoteTicketIds?.[j];
        const suffix = tid ? `  [#${tid}: https://lumebeauty.gorgias.com/app/ticket/${tid}]` : "";
        lines.push(`   "${q}"${suffix}`);
      });
      if (t.signal) lines.push(`   Signal: ${t.signal}`);
      if (t.action) lines.push(`   Action: ${t.action}`);
      lines.push(``);
    });
    if (d.trendsSampleSize) {
      lines.push(d.trendsReadAll
        ? `(read every customer message: ${d.trendsSampleSize} tickets; counts exact)`
        : `(read ${d.trendsSampleSize} customer messages; counts estimated from sample)`);
    }
    lines.push(``);
  }
  if (d.feedbackByTheme.length) {
    lines.push(`CUSTOMER INSIGHTS`);
    lines.push(`Themes:`);
    d.feedbackByTheme.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    if (d.feedbackSuggestions?.length) {
      lines.push(`Ways to improve (agent suggestions):`);
      d.feedbackSuggestions.forEach((s) => lines.push(`  → ${s.suggestion} (${prettyEnum(s.theme, FEEDBACK_THEMES)}${s.relatedTeam ? " / " + s.relatedTeam : ""})`));
    }
    lines.push(``);
  }
  if (d.notes && d.notes.trim().length > 0) {
    lines.push(`NOTES`);
    // Preserve the author's own formatting (line breaks, bullets, dashes).
    d.notes.split(/\r?\n/).forEach((ln) => lines.push(ln));
    lines.push(``);
  }
  lines.push(`— Sent from LUMÉ HAIR Hub`);
  return lines.join("\n");
}

function buildHtmlEmail(d) {
  const wrapStyle = "font-family:Arial,sans-serif;color:#3A2F2C;max-width:680px;line-height:1.5;";
  const h2 = `font-family:Georgia,serif;color:#50000B;margin:24px 0 6px;font-size:18px;letter-spacing:0.3px;`;
  const tag = `display:inline-block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C8973A;font-weight:700;`;
  const td = `padding:6px 10px;border-bottom:1px solid #EDE3D8;font-size:13px;`;
  const tdR = td + "text-align:right;";
  const out = [];
  const fmtNum = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString();
  const fmtPct = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;
  out.push(`<div style="${wrapStyle}">`);
  out.push(`<p>Hi team,</p>`);
  out.push(`<p style="font-style:italic;color:#5a4f4a;">LUMÉ HAIR weekly summary —<strong>${d.weekLabel}</strong>.</p>`);

  // Key metrics tile grid. Filter out tiles with no real value ("—") so
  // empty cells don't show as awkward gaps in the email — Cherie flagged
  // those as visual noise. Also collapses unfilled rows entirely.
  out.push(`<div style="${tag};margin-top:8px;">Key metrics</div>`);
  const allMetrics = [
    ["Tickets", fmtNum(d.gorgias?.volume)],
    ["Open", fmtNum(d.gorgias?.byStatus?.open)],
    ["Closed", fmtNum(d.gorgias?.byStatus?.closed)],
    ["CSAT", d.gorgias?.csat?.average != null ? d.gorgias.csat.average.toFixed(2) : "—"],
    ["Resolution", d.gorgias?.resolution?.avgSeconds != null ? formatDuration(d.gorgias.resolution.avgSeconds) : "—"],
    ["Msgs / ticket", d.gorgias?.mpt?.average != null ? d.gorgias.mpt.average.toFixed(1) : "—"],
    ["Orders", fmtNum(d.shop?.orders)],
    ["Refunds", fmtNum(d.refunds?.count)],
    ["Refund rate ($)", fmtPct(d.shop?.refundRateDollars ?? null)],
    ["Refund rate (#)", fmtPct(d.shop?.refundRate ?? (d.refunds?.count && d.shop?.orders ? d.refunds.count / d.shop.orders : null))],
    ["Active subs", fmtNum(d.skio?.active)],
    ["Cancellations", fmtNum(d.skio?.cancelled)],
    ["Churn rate", fmtPct(d.skio?.churnRate)],
  ];
  const metrics = allMetrics.filter(([_, v]) => v != null && v !== "—" && v !== "");
  out.push(`<table style="border-collapse:collapse;width:100%;margin-top:6px;">`);
  for (let i = 0; i < metrics.length; i += 4) {
    out.push(`<tr>`);
    const rowItems = metrics.slice(i, i + 4);
    rowItems.forEach((m) => {
      out.push(`<td style="${td};border-right:1px solid #EDE3D8;"><div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">${m[0]}</div><div style="font-family:Georgia,serif;color:#50000B;font-weight:700;font-size:18px;">${m[1]}</div></td>`);
    });
    out.push(`</tr>`);
  }
  out.push(`</table>`);

  if (d.refunds) {
    const totalRefunds = d.shop?.refunded ?? d.refunds.count ?? 0;
    const totalAmount = d.shop?.refundAmount ?? d.refunds.total ?? 0;
    const directCount = d.shop?.refunded != null && d.refunds?.count != null
      ? Math.max(0, d.shop.refunded - d.refunds.count) : null;
    const directAmount = d.shop?.refundAmount != null && d.refunds?.total != null
      ? Math.max(0, d.shop.refundAmount - d.refunds.total) : null;
    // Extra top margin pushes the heading down ~2 rows from Key Metrics
    // for breathing room. The h2 right below it gets margin:0 instead of
    // the default top spacing so the $ total hugs the heading.
    out.push(`<div style="${tag};margin-top:32px;">Refunds</div>`);
    {
      const rateBits = [];
      if (d.shop?.refundRateDollars != null) rateBits.push(`${(d.shop.refundRateDollars * 100).toFixed(2)}% ($)`);
      if (d.shop?.refundRate != null) rateBits.push(`${(d.shop.refundRate * 100).toFixed(2)}% by count`);
      const rateStr = rateBits.length ? ` · rate ${rateBits.join(" / ")}` : "";
      // Tight h2: 4px top margin (was 24) so the total hugs "Refunds".
      out.push(`<h2 style="font-family:Georgia,serif;color:#50000B;margin:4px 0 6px;font-size:18px;letter-spacing:0.3px;">${formatMoney(totalAmount)} <span style="color:#999;font-weight:400;font-size:13px;">· ${totalRefunds} cases${rateStr}</span></h2>`);
    }
    out.push(`<p style="margin:0 0 8px;font-size:12px;color:#5a4f4a;">${d.refunds.count ?? 0} customer-initiated (${formatMoney(d.refunds.total)})${directCount != null ? ` · ${directCount} direct in Shopify (${formatMoney(directAmount)})` : ""}</p>`);
    out.push(`<table style="border-collapse:collapse;width:100%;margin-top:8px;">`);
    out.push(`<tr style="background:#F5F0EB;"><td style="${td};color:#999;">Category</td><td style="${tdR};color:#999;">Cases</td><td style="${tdR};color:#999;">Total $</td></tr>`);
    const m = d.refunds.matrix ?? {};
    const ROWS = [["Monthly","Hair Edit (monthly)"],["Bimonthly","Skip-month / bi-monthly"],["Refills","Renewal orders"],["OTP","One-time purchases"]];
    ROWS.forEach(([k, label]) => {
      const c = m[k] ?? { count: 0, amount: 0 };
      out.push(`<tr><td style="${td};color:#50000B;font-weight:600;">${label}</td><td style="${tdR}">${c.count}</td><td style="${tdR};color:#50000B;font-weight:700;">${formatMoney(c.amount)}</td></tr>`);
    });
    if (directCount != null) {
      out.push(`<tr><td style="${td};color:#50000B;font-weight:600;font-style:italic;">Processed directly in Shopify</td><td style="${tdR}">${directCount}</td><td style="${tdR};color:#50000B;font-weight:700;">${formatMoney(directAmount)}</td></tr>`);
    }
    if (d.shop?.refunded != null) {
      out.push(`<tr style="background:#50000B;color:#F5F0EB;"><td style="${td};color:#F5F0EB;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:1px;">Total (all sources)</td><td style="${tdR};color:#F5F0EB;font-weight:700;">${d.shop.refunded}</td><td style="${tdR};color:#C8973A;font-weight:700;">${formatMoney(totalAmount)}</td></tr>`);
    }
    out.push(`</table>`);
    if ((d.refunds.topReasons ?? []).length) {
      out.push(`<div style="${tag};margin-top:16px;">Top 3 refund reasons</div>`);
      out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
      d.refunds.topReasons.forEach((rr) => out.push(`<li>${rr.reason} — <strong>${rr.count}</strong></li>`));
      out.push(`</ul>`);
    }
  }
  if (d.skio) {
    out.push(`<div style="${tag};margin-top:24px;">Subscriptions (Skio)</div>`);
    out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
    if (d.skio.active != null)        out.push(`<li>Active: <strong>${d.skio.active.toLocaleString()}</strong>${d.skio.paused != null ? ` (${d.skio.paused.toLocaleString()} paused)` : ""}</li>`);
    if (d.skio.churnRate != null)     out.push(`<li>Churn: <strong>${(d.skio.churnRate * 100).toFixed(2)}%</strong></li>`);
    if (d.skio.cancelled != null)     out.push(`<li>Cancellations: <strong>${d.skio.cancelled.toLocaleString()}</strong></li>`);
    if (d.skio.created != null)       out.push(`<li>New subs: <strong>${d.skio.created.toLocaleString()}</strong></li>`);
    if (d.skio.failedPayments != null)out.push(`<li>Failed payments: <strong>${d.skio.failedPayments.toLocaleString()}</strong></li>`);
    out.push(`</ul>`);
    if ((d.skioReasons?.topCancelReasons ?? []).length > 0) {
      out.push(`<div style="${tag};margin-top:14px;">Cancellation reasons — customer-selected${d.skioReasons.totalCancelled ? ` <span style="color:#A89A8E;font-weight:400;text-transform:none;letter-spacing:0;">(${d.skioReasons.totalCancelled.toLocaleString()} sessions)</span>` : ""}</div>`);
      out.push(`<table style="border-collapse:collapse;width:100%;margin-top:6px;">`);
      const totalC = d.skioReasons.totalCancelled || d.skioReasons.topCancelReasons.reduce((s, r) => s + r.count, 0);
      d.skioReasons.topCancelReasons.slice(0, 10).forEach((r) => {
        const pct = totalC ? Math.round((r.count / totalC) * 100) : 0;
        out.push(`<tr><td style="${td}">${r.reason}</td><td style="${tdR};color:#50000B;font-weight:700;">${r.count.toLocaleString()} <span style="color:#A89A8E;font-weight:400;font-size:10px;">(${pct}%)</span></td></tr>`);
      });
      out.push(`</table>`);
    }
  }
  const block = (title, entries, n = 5) => {
    if (!entries.length) return;
    out.push(`<div style="${tag};margin-top:24px;">${title}</div>`);
    out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
    entries.slice(0, n).forEach((e) => out.push(`<li>${e.key}: <strong>${e.count}</strong></li>`));
    out.push(`</ul>`);
  };
  // Drill-down link helper: wraps a count in an anchor that deep-links
  // into the matching Records sub-tab on the live hub. Stakeholders can
  // click the number to see the actual entries instead of just totals.
  // The hash fragment (#records:Issues etc.) is read on mount by the
  // App and RecordsTab components to land on the right sub-tab — the
  // hub itself is a single-page app, so all tabs share this base URL.
  const HUB = "https://cx.withluma.com.au";
  const drill = (count, sub) =>
    `<a href="${HUB}/#records:${sub}" style="color:#50000B;font-weight:700;text-decoration:underline;">${count}</a>`;
  // "Cancellation reasons (agent-tagged)" block removed at Cherie's
  // request — duplicates info elsewhere and adds noise. Skio's
  // customer-selected cancel reasons remain (different signal).
  if (d.issuesAll?.length) {
    out.push(`<div style="${tag};margin-top:24px;">Order issues (${drill(d.issuesAll.length, "Issues")} this week)</div>`);
    block("By warehouse", d.issuesByWarehouse, 8);
    block("By category", d.issuesByCategory, 6);
  }
  // Add a count + drill-down link above each replacements block so the
  // header doubles as a way into the Records view.
  const replacementsTotal = (d.replacementsByReason ?? []).reduce((s, e) => s + (e.count || 0), 0);
  if (replacementsTotal > 0) {
    out.push(`<div style="${tag};margin-top:24px;">Replacements (${drill(replacementsTotal, "Replacements")} this week)</div>`);
    block("By reason", d.replacementsByReason);
    block("By warehouse", d.replacementsByWarehouse);
  }
  if (d.adverseCount > 0) {
    out.push(`<div style="${tag};margin-top:24px;">Adverse reactions</div>`);
    out.push(`<p style="margin:4px 0;">${drill(d.adverseCount, "Adverse-Reactions")} filed${d.adverseSerious > 0 ? ` · <strong style="color:#A40011;">${d.adverseSerious} serious (SAE)</strong>` : ""}</p>`);
  }
  // Trends section removed from the stakeholder email May 17 — see
  // trends-state comment in ReportsTab. d.trends no longer exists,
  // but `(d.trends ?? []).length` would safely return 0, so this is
  // intentionally a comment rather than a guarded no-op.
  if (d.feedbackByTheme.length) {
    // One unified "Customer Insights" header (no nested "Themes" subhead).
    // The count is hyperlinked to drill into Records → Feedback.
    const feedbackTotal = d.feedbackByTheme.reduce((s, e) => s + (e.count || 0), 0);
    out.push(`<div style="${tag};margin-top:24px;">Customer Insights (${drill(feedbackTotal, "Feedback")} this week)</div>`);
    out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
    d.feedbackByTheme.slice(0, 6).forEach((e) => out.push(`<li>${e.key}: <strong>${e.count}</strong></li>`));
    out.push(`</ul>`);
    if (d.feedbackSuggestions?.length) {
      out.push(`<p style="margin:8px 0 4px;font-size:12px;color:#50000B;font-weight:700;">Ways to improve (agent suggestions):</p>`);
      out.push(`<ul style="margin:4px 0;padding-left:22px;">`);
      d.feedbackSuggestions.forEach((s) => out.push(`<li style="margin:3px 0;">${s.suggestion} <span style="color:#A89A8E;font-size:11px;">— ${prettyEnum(s.theme, FEEDBACK_THEMES)}${s.relatedTeam ? " / " + s.relatedTeam : ""}</span></li>`));
      out.push(`</ul>`);
    }
  }
  if (d.notes && d.notes.trim().length > 0) {
    out.push(`<div style="${h2};margin-top:28px;">Notes</div>`);
    // Escape any HTML in the user's text and preserve newlines as <br>s.
    const escaped = d.notes
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    out.push(`<div style="font-size:14px;line-height:1.6;white-space:pre-wrap;background:#FAF6F1;border-left:3px solid #C8973A;padding:12px 16px;border-radius:6px;">${escaped}</div>`);
  }
  out.push(`<p style="margin-top:32px;font-size:11px;color:#A89A8E;letter-spacing:0.5px;">— Sent from LUMÉ HAIR Hub</p>`);
  out.push(`</div>`);
  return out.join("");
}

function SendToStakeholdersModal({ report, fromDate, toDate, onClose }) {
  const [recipients, setRecipients] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STAKEHOLDERS_KEY) ?? "";
  });
  const [subject, setSubject] = useState(`LUMÉ HAIR Weekly Summary — ${fmtWeekLabel(fromDate, toDate)}`);
  // Plain-text fallback for the clipboard's text/plain mime type. We
  // generate it fresh from the current report so it always matches the
  // HTML preview shown above. Not editable in the UI any more — the
  // iframe preview is the source of truth.
  const bodyText = useMemo(() => buildPlainTextEmail(report), [report]);
  const [copyState, setCopyState] = useState(null);

  function persistRecipients(v) {
    setRecipients(v);
    if (typeof window !== "undefined") localStorage.setItem(STAKEHOLDERS_KEY, v);
  }

  // Two-step send flow:
  //   1. copyReport — puts rich HTML + plain text on the clipboard
  //   2. openGmail  — opens Gmail compose with To + Subject prefilled
  // Browsers don't allow one tab to inject content into another tab's
  // compose body, so the user pastes (Cmd+V) once Gmail loads. Splitting
  // the action makes the paste step obvious instead of invisible.
  async function copyReport() {
    try {
      const html = buildHtmlEmail(report);
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([bodyText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
        ]);
      } else {
        await navigator.clipboard.writeText(bodyText);
      }
      setCopyState("copied");
      setTimeout(() => setCopyState((s) => (s === "copied" ? null : s)), 4000);
    } catch (e) {
      setCopyState("error");
    }
  }

  function openGmail() {
    const to = recipients.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).join(",");
    const params = new URLSearchParams({
      view: "cm", fs: "1",
      to,
      su: subject,
      // Body left blank — user pastes the HTML they copied above.
    });
    const url = `https://mail.google.com/mail/?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }


  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,10,15,0.55)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: W, borderRadius: 14, maxWidth: 720, width: "100%", padding: "28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>Send to Stakeholders</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: INK, opacity: 0.5, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Recipients (comma or newline separated)</div>
          <textarea value={recipients} onChange={(e) => persistRecipients(e.target.value)} rows={2} placeholder="name@lumehair.com" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, marginTop: 3 }}>Saved locally — edit once, reused next week.</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Subject</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Preview (this is what your stakeholders will see)</div>
          {/* Render the actual HTML report in a sandboxed iframe so you
              can verify formatting before clicking Email. The iframe is
              isolated from the parent page's CSS so it renders the same
              way Gmail will. */}
          <iframe
            title="Report preview"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;padding:0;">${buildHtmlEmail(report)}</body></html>`}
            style={{ width: "100%", height: 420, border: "1px solid " + SOFT_BORDER, borderRadius: 8, background: "#FFF" }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button onClick={copyReport} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            {copyState === "copied" ? "Copied ✓" : "1. Copy report"}
          </button>
          <button onClick={openGmail} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            2. Email
          </button>
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, marginTop: 10, opacity: 0.7, lineHeight: 1.5 }}>
          Click <strong>Copy report</strong>, then click <strong>Email</strong>. Gmail will open in a new tab — click in the body and paste with <strong>Cmd + V</strong> (Mac) or <strong>Ctrl + V</strong> (Windows).
        </div>
        {copyState === "error" && <div style={{ fontFamily: F.sans, fontSize: 12, color: RED, marginTop: 8 }}>Could not access clipboard — try again or copy manually.</div>}

      </div>
    </div>
  );
}

// ─── Logs Tab (replaces team spreadsheets) ───────────────────────
// May 13, 2026 — "Cancellations" hidden per Aina's testing feedback
// (data is already in Skio, no need to log separately). The model,
// API route, and CancellationLogPanel component are preserved as
// orphans in case we ever need to revive the tab.
const LOGS_SUBTABS = ["Order Issue", "Replacements", "Reaction/Concern", "Feedback", "3PL Claim"];

// Ops Request "Warehouse" dropdown — the three canonical LUMÉ
// warehouses (Parcelline 3PL), matching the Issue tab's Warehouse field,
// the warehouseFromCountry helper, and every other warehouse surface in
// the hub. No "Other" — every order ships from one of the three.
const OPS_REGIONS = WAREHOUSES.map((w) => ({ value: w, label: w }));
const OPS_STATUSES = [
  { value: "pending",     label: "Pending — awaiting Ops" },
  { value: "in-progress", label: "In progress" },
  { value: "shipped",     label: "Shipped" },
  { value: "delivered",   label: "Delivered" },
  { value: "cancelled",   label: "Cancelled" },
];

const AR_METHODS = [
  { value: "email",      label: "Email" },
  { value: "phone",      label: "Phone" },
  { value: "live-chat",  label: "Live chat" },
  { value: "instagram",  label: "Instagram DM" },
  { value: "facebook",   label: "Facebook" },
  { value: "tiktok",     label: "TikTok" },
  { value: "other",      label: "Other" },
];
const AR_SEVERITY = [
  { value: "low",      label: "Low — minor / transient" },
  { value: "moderate", label: "Moderate — affecting daily activity" },
  { value: "high",     label: "High — significant impact" },
  { value: "serious",  label: "SERIOUS — hospitalization / life-threatening" },
];
const AR_STATUS = [
  { value: "open",         label: "Open" },
  { value: "under-review", label: "Under review (QC)" },
  { value: "closed",       label: "Closed" },
];
const AR_ESCALATION = ["Head of CX", "VP Ops", "Legal", "QC Manager", "Medical Affairs", "Other"];
const AR_COMMON_SYMPTOMS = [
  "Redness", "Itching", "Burning sensation", "Rash / hives", "Flaking / dryness",
  "Swelling", "Watery eyes", "Breakout along hairline", "Other",
];

// Combined list — the new May 2026 taxonomy (from REPLACEMENT_MAIN_REASONS)
// PLUS legacy single-reason values still on old rows. This is what Reports
// and Records use to render the human label for `r.reason`. The Replacement
// form itself uses the new multi-select; this is purely for backwards-compat
// label rendering on historical data + first-main display.
const REPLACEMENT_REASONS = [
  // Current taxonomy
  ...REPLACEMENT_MAIN_REASONS.map((m) => ({ value: m.value, label: m.label })),
  // Legacy values — only appear on old rows
  { value: "wrong-item",      label: "Wrong item received" },
  { value: "order-change",    label: "Order change" },
  { value: "customer-damage", label: "Accidental customer damage" },
  { value: "other",           label: "Other" },
];
const REPLACEMENT_TYPES = [
  { value: "replacement", label: "Replacement" },
  { value: "gift",        label: "Free gift (no refund)" },
];
const REPLACEMENT_STATUSES = [
  { value: "pending",     label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "shipped",     label: "Shipped" },
  { value: "delivered",   label: "Delivered" },
  { value: "cancelled",   label: "Cancelled" },
];

const CANCELLATION_TYPES = [
  { value: "too-expensive",         label: "Too expensive / budget" },
  { value: "wrong-serums",          label: "Wrong serums for hair type" },
  { value: "not-using-fast-enough", label: "Not using fast enough / too much product" },
  { value: "no-results-seen",       label: "No results seen" },
  { value: "switching-brand",       label: "Switching to another brand" },
  { value: "personal-life-change",  label: "Personal / life change" },
  { value: "adverse-reaction",      label: "Adverse reaction" },
  { value: "duplicate-order",       label: "Duplicate order" },
  { value: "address-change",        label: "Address / moving" },
  { value: "other",                 label: "Other" },
];
const CANCELLATION_SCOPES = [
  { value: "subscription", label: "Subscription only" },
  { value: "order",        label: "Order only" },
  { value: "both",         label: "Order + Subscription" },
];

const FEEDBACK_THEMES = [
  { value: "product",       label: "Product" },
  { value: "packaging",     label: "Packaging" },
  { value: "subscription",  label: "Subscription" },
  { value: "shipping",      label: "Shipping" },
  { value: "pricing",       label: "Pricing" },
  { value: "marketing",     label: "Marketing" },
  { value: "loyalty",       label: "Loyalty / referral" },
  { value: "tech",          label: "Tech / website" },
  { value: "service",       label: "CX service" },
  { value: "other",         label: "Other" },
];
const FEEDBACK_TEAMS = ["Product", "Marketing", "Ops/Logistics", "Tech", "CX", "Other"];

const ISSUE_CATEGORIES = [
  { value: "missing-item",     label: "Missing item" },
  { value: "damaged-item",     label: "Damaged item" },
  { value: "wrong-item",       label: "Wrong serum / wrong box" },
  { value: "leaked-bottle",    label: "Leaked bottle" },
  { value: "broken-pump",      label: "Broken pump mechanism" },
  { value: "crushed-packaging", label: "Crushed / damaged packaging" },
  { value: "tampered-package", label: "Tampered packaging" },
  { value: "other",            label: "Other" },
];
const ISSUE_RESOLUTIONS = [
  { value: "pending",     label: "Pending" },
  { value: "replacement", label: "Replacement" },
  { value: "refund",      label: "Refund" },
  { value: "gift",        label: "Free gift" },
  { value: "no-action",   label: "No action" },
];
// Canonical warehouse list + country mapping live in lib/demo-dates.js
// (shared with the seed data so every record resolves to a real
// warehouse — nothing ever buckets as "Unspecified").
const ISSUE_WAREHOUSES = WAREHOUSES;
const ISSUE_SEVERITY = [
  { value: "low",    label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high",   label: "High" },
];

// Reusable multi-select chips component (used by Issues Items Affected
// and Replacement Main/Sub Reason fields). Click to toggle; selected
// items show as filled burgundy chips, unselected as outline.
// Per-group dropdown picker. Replaces the chip-wall display of
// grouped SKU options that Cherie called "overwhelming" on 2026-05-15.
// One header + dropdown per PRODUCT_CATALOGUE group; picking from
// any dropdown appends to the selected list shown as pills above.
// Click a pill's × to remove. Items already selected appear as
// "(added)" + disabled in their dropdown so they can't be picked twice.
function MultiSelectGroupedDropdowns({ groupedOptions, selected, onChange, placeholder }) {
  const sel = new Set(selected || []);

  function addItem(value) {
    if (!value || sel.has(value)) return;
    onChange([...(selected || []), value]);
  }
  function removeItem(value) {
    onChange((selected || []).filter((v) => v !== value));
  }

  const headerStyle = { fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 };
  const selectStyle = { width: "100%", padding: "8px 12px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12, color: INK, background: W, outline: "none", boxSizing: "border-box", cursor: "pointer" };

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 12 }}>
      {/* Selected items appear as removable pills at the top */}
      {selected && selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: "1px dashed " + SOFT_BORDER }}>
          {selected.map((v) => (
            <span key={v} onClick={() => removeItem(v)} style={{ background: BURG, color: CREAM, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 99, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {v}
              <span style={{ opacity: 0.7, fontSize: 10 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* One dropdown per catalogue group */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        {groupedOptions.map((group) => (
          <div key={group.group}>
            <div style={headerStyle}>{group.group}</div>
            <Combobox
              value=""
              onChange={(v) => { if (v) addItem(v); }}
              options={group.items.filter((item) => !sel.has(item))}
              placeholder={placeholder || "Add an item…"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiSelectChips({ options, selected, onChange, placeholder, search = false, groupedOptions = null }) {
  const [query, setQuery] = useState("");
  const sel = new Set(selected || []);

  const matchesQuery = (label) => !query.trim() || label.toLowerCase().includes(query.trim().toLowerCase());

  function toggle(value) {
    const next = sel.has(value) ? selected.filter((v) => v !== value) : [...selected, value];
    onChange(next);
  }

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 10 }}>
      {search && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Search…"}
          style={{ width: "100%", padding: "6px 10px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12, marginBottom: 8, outline: "none", background: CREAM }}
        />
      )}

      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: "1px dashed " + SOFT_BORDER }}>
          {selected.map((v) => {
            const labelLookup = options?.find?.((o) => (typeof o === "string" ? o : o.value) === v);
            const label = typeof labelLookup === "string" ? labelLookup : (labelLookup?.label ?? v);
            return (
              <span key={v} onClick={() => toggle(v)} style={{ background: BURG, color: CREAM, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 99, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                {label}
                <span style={{ opacity: 0.7, fontSize: 10 }}>×</span>
              </span>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: search ? 220 : "none", overflowY: search ? "auto" : "visible" }}>
        {groupedOptions ? (
          groupedOptions.map((group) => {
            const filteredItems = group.items.filter(matchesQuery);
            if (filteredItems.length === 0) return null;
            return (
              <div key={group.group} style={{ width: "100%" }}>
                <div style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", margin: "8px 0 4px" }}>{group.group}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {filteredItems.map((opt) => {
                    const isSel = sel.has(opt);
                    return (
                      <button key={opt} type="button" onClick={() => toggle(opt)} style={{
                        background: isSel ? BURG : "transparent",
                        color: isSel ? CREAM : INK,
                        border: "1px solid " + (isSel ? BURG : SOFT_BORDER),
                        fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "5px 11px",
                        borderRadius: 99, cursor: "pointer",
                      }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          options.filter((opt) => matchesQuery(typeof opt === "string" ? opt : opt.label)).map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            const isSel = sel.has(value);
            return (
              <button key={value} type="button" onClick={() => toggle(value)} style={{
                background: isSel ? BURG : "transparent",
                color: isSel ? CREAM : INK,
                border: "1px solid " + (isSel ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "5px 11px",
                borderRadius: 99, cursor: "pointer",
              }}>{label}</button>
            );
          })
        )}
      </div>
    </div>
  );
}

function LogsTab({ role, subRequest, setTab }) {
  const canSeeRecords = canAccessTab("Records", role);
  const onViewRecords = canSeeRecords && setTab ? () => setTab("Records") : null;
  const isOpsRole = role === "Ops";
  const visibleSubtabs = LOGS_SUBTABS;
  const [sub, setSub] = useState("Order Issue");
  // Cmd+K "Log …" actions land on the right sub-tab.
  useEffect(() => {
    if (subRequest?.sub && LOGS_SUBTABS.includes(subRequest.sub)) setSub(subRequest.sub);
  }, [subRequest]);
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const SUBTAB_TAGLINES = {
    "Order Issue":       "Log damaged, missing, or incorrect items. Enter the LUMÉ order number and note what went wrong.",
    "Replacements":      "Capture replacement dispatches. Order number auto-fills customer details — pick the reason and items affected.",
    "Reaction/Concern":  "Any customer reporting an unexpected skin or scalp reaction. Log verbatim and escalate immediately to Head of CX.",
    "Feedback":          "Positive shoutouts, feature requests, and constructive notes. Order ID optional for social/chat feedback.",
    "3PL Claim":         "File a claim against Parcelline for lost, damaged, or mis-picked stock. Items map to landed cost; claims batch to Parcelline weekly.",
  };
  const tagline = SUBTAB_TAGLINES[sub] ?? "Log entries here — they feed the weekly report automatically.";
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ HAIR — Logs</div>
        <div style={{ fontFamily: F.serif, fontSize: "clamp(32px, 7vw, 48px)", color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 14, letterSpacing: -1 }}>
          {sub}
        </div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6, marginBottom: 20, maxWidth: 700 }}>
          {tagline}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {visibleSubtabs.map((s) => {
              const active = s === sub;
              return (
                <button key={s} onClick={() => setSub(s)} style={{
                  background: active ? BURG : "transparent",
                  color: active ? CREAM : BURG,
                  border: "1px solid " + (active ? BURG : SOFT_BORDER),
                  fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                  letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                }}>{s}</button>
              );
            })}
          </div>
      </div>
      {sub === "Order Issue" && <IssueLogPanel role={role} onViewRecords={onViewRecords} />}
      {sub === "Replacements" && <ReplacementLogPanel role={role} onViewRecords={onViewRecords} />}
      {sub === "Reaction/Concern" && <AdverseReactionLogPanel role={role} onViewRecords={onViewRecords} />}
      {sub === "Feedback" && <FeedbackLogPanel role={role} onViewRecords={onViewRecords} />}
      {sub === "3PL Claim" && <ClaimLogPanel role={role} onViewRecords={onViewRecords} />}
    </div>
  );
}

// ─── Logging-loop helpers (2.1 / 2.5) ────────────────────────────────────────

// Draft persistence: unsaved form state survives tab switches within the
// session. Pass { fieldName: [value, setter] } — restores once on mount,
// saves on every change, and the returned function clears the draft.
function useFormDraft(key, fields) {
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(key) || "null");
      if (saved) {
        for (const [name, pair] of Object.entries(fields)) {
          if (saved[name] !== undefined) pair[1](saved[name]);
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      const out = {};
      let any = false;
      for (const [name, pair] of Object.entries(fields)) {
        out[name] = pair[0];
        const v = pair[0];
        if (v && (!Array.isArray(v) || v.length > 0)) any = true;
      }
      if (any) window.sessionStorage.setItem(key, JSON.stringify(out));
      else window.sessionStorage.removeItem(key);
    } catch { /* ignore */ }
  });
  return () => { try { window.sessionStorage.removeItem(key); } catch { /* ignore */ } };
}

// Keyboard-first forms: Enter submits from any field once required fields
// are valid; Esc clears focus. Textareas and open comboboxes keep their
// native Enter behaviour.
function makeFormKeyHandler(submit) {
  return (e) => {
    if (e.key === "Escape") { e.target?.blur?.(); return; }
    if (e.key !== "Enter" || e.shiftKey) return;
    const tag = e.target?.tagName;
    if (tag === "TEXTAREA" || tag === "BUTTON") return;
    if (e.target?.closest?.("[role=combobox],[role=listbox]")) return;
    e.preventDefault();
    submit();
  };
}

// 2.5 — agents can edit their own entries for 60 minutes, then the record
// locks (Manager+ can still edit via Records).
const EDIT_WINDOW_MS = 60 * 60 * 1000;
function canEditLogRow(r, role) {
  if (role && ["Manager", "Admin", "Owner"].includes(role)) return true;
  return Date.now() - new Date(r.createdAt).getTime() < EDIT_WINDOW_MS;
}

// Trailing "Edit" column for the recent lists. onEdit(null) means locked.
function editColumn(role, onEdit, lockTitle) {
  return {
    key: "_edit", label: "", width: 60,
    render: (r) => {
      const editable = onEdit && canEditLogRow(r, role);
      if (editable) {
        return (
          <button onClick={() => onEdit(r)} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 99, cursor: "pointer" }}>
            Edit
          </button>
        );
      }
      return (
        <span title={lockTitle || "Locked — the 60-minute edit window has passed. A Manager can edit this in Records."} style={{ fontFamily: F.sans, fontSize: 12, opacity: 0.4, cursor: "help" }} aria-label="Locked">🔒</span>
      );
    },
  };
}

// Success state after a save — the form resets, a toast confirms, and the
// action bar flips to "Log another" + "View in Records".
function SavedActions({ savedLabel, onLogAnother, onViewRecords }) {
  return (
    <>
      <span style={{ fontFamily: F.sans, fontSize: 12, color: CHIP_GREEN, fontWeight: 700 }}>✓ {savedLabel}</span>
      {onViewRecords && (
        <button onClick={onViewRecords} style={{ background: "transparent", border: "none", fontFamily: F.sans, fontSize: 12, color: BURG, textDecoration: "underline", cursor: "pointer", padding: 0 }}>
          View in Records
        </button>
      )}
      <button onClick={onLogAnother} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
        Log another
      </button>
    </>
  );
}

// ─── Shared helpers for the "Recent" tables in each Log panel ────────
// Michelle (May 13): stacked cards were noisy. Compact table + last 7
// days only gives the team a scannable list of what just landed.

function filterLast7Days(rows) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return (rows || []).filter((r) => {
    if (!r?.createdAt) return false;
    const t = new Date(r.createdAt).getTime();
    return Number.isFinite(t) && t > cutoff;
  });
}

function shortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

function truncate(text, n) {
  if (!text) return "—";
  const s = String(text);
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

// Reusable compact table for the "Recent" sections under each panel.
// `columns` = [{ key, label, width?, render? }]
function RecentLogTable({ rows, columns, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55, padding: "14px 0" }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans }}>
        <thead>
          <tr style={{ background: CREAM }}>
            {columns.map((c) => (
              <th key={c.key} style={{
                padding: "10px 12px",
                textAlign: "left",
                fontSize: 9,
                fontWeight: 700,
                color: BURG,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                borderBottom: "1px solid " + SOFT_BORDER,
                width: c.width,
                whiteSpace: "nowrap",
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} style={{ borderTop: i === 0 ? "none" : "1px solid " + SOFT_BORDER }}>
              {columns.map((c) => (
                <td key={c.key} style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  color: INK,
                  lineHeight: 1.45,
                  verticalAlign: "top",
                }}>
                  {c.render ? c.render(r) : (r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueLogPanel({ role, onViewRecords }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  const [warehouse, setWarehouse] = useState("");
  // Aina May 22 — category / severity / resolution now mandatory; start
  // each as empty so the agent has to actively pick one rather than
  // defaulting through. Validation in submit() blocks blank values.
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  // Items Affected: now a multi-select from PRODUCT_CATALOGUE (Aina's request).
  // The old single textarea was producing inconsistent free-text entries.
  // Mandatory as of May 22.
  const [itemsAffected, setItemsAffected] = useState([]);
  const [description, setDescription] = useState("");
  const [photoUrlsText, setPhotoUrlsText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [resolution, setResolution] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => issuesSeed()); // instant render — refreshed silently
  const [scope, setScope] = useState("own");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savedLabel, setSavedLabel] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const orderInputRef = useRef(null);
  const cardRef = useRef(null);

  // Draft survives tab switches within the session (2.1).
  const clearDraft = useFormDraft("draft_issue", {
    orderId: [orderId, setOrderId], ticketId: [ticketId, setTicketId],
    customerName: [customerName, setCustomerName], customerEmail: [customerEmail, setCustomerEmail],
    country: [country, setCountry], warehouse: [warehouse, setWarehouse],
    category: [category, setCategory], severity: [severity, setSeverity],
    itemsAffected: [itemsAffected, setItemsAffected], description: [description, setDescription],
    photoUrlsText: [photoUrlsText, setPhotoUrlsText], videoUrl: [videoUrl, setVideoUrl],
    resolution: [resolution, setResolution], resolutionNotes: [resolutionNotes, setResolutionNotes],
  });

  // Fresh input clears the "saved" state so the bar returns to Save.
  useEffect(() => { if (savedLabel && (orderId || description)) setSavedLabel(null); }, [orderId, description]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/issues?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScope(json.scope ?? "own");
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    const id = orderId.trim();
    if (!id) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
      // Warehouse: prefer Shopify's actual fulfillment location (resolved
      // server-side from order.fulfillments[].location_id). Fall back to
      // country-based mapping only if the order isn't fulfilled yet.
      const wh = json.warehouse || warehouseFromCountry(json.country);
      if (wh) setWarehouse(wh);
      const items = (json.lineItems ?? [])
        .map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""} x${li.quantity}`)
        .join("\n");
      setLookupHint({ items, fulfillment: json.fulfillmentStatus, financial: json.financialStatus });
      // Pre-select Items affected from the order's line items when the
      // agent hasn't picked any yet — one less field to touch.
      if (itemsAffected.length === 0) {
        const catalogue = new Set(PRODUCT_CATALOGUE_SIMPLE.flatMap((g) => g.items));
        const mapped = (json.lineItems ?? []).map((li) => `${li.title} x${li.quantity}`).filter((v) => catalogue.has(v));
        if (mapped.length > 0) setItemsAffected(mapped);
      }
    } catch (e) {
      setLookupError(e.message);
    } finally {
      setLookupLoading(false);
    }
  }

  function startEdit(r) {
    setEditingId(r.id);
    setSavedLabel(null);
    setOrderId(r.orderId || ""); setTicketId(r.ticketId || "");
    setCustomerName(r.customerName || ""); setCustomerEmail(r.customerEmail || "");
    setCountry(r.country || ""); setWarehouse(r.warehouse || "");
    setCategory(r.category || ""); setSeverity(r.severity || "");
    setItemsAffected(r.itemsAffected || []); setDescription(r.description || "");
    setPhotoUrlsText((r.photoUrls || []).join("\n")); setVideoUrl(r.videoUrl || "");
    setResolution(r.resolution || ""); setResolutionNotes(r.resolutionNotes || "");
    setShowMore(Boolean((r.photoUrls || []).length || r.videoUrl || r.resolutionNotes));
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
    setWarehouse(""); setCategory(""); setSeverity("");
    setItemsAffected([]); setDescription(""); setPhotoUrlsText(""); setVideoUrl("");
    setResolution(""); setResolutionNotes("");
    setLookupHint(null); setEditingId(null);
    clearDraft();
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket ID required"); return; }
    // Aina May 22 — mandatory fields tightened.
    if (!category) { setFormError("Category required"); return; }
    if (!severity) { setFormError("Severity required"); return; }
    if (!resolution) { setFormError("Resolution required"); return; }
    if (itemsAffected.length === 0) { setFormError("At least one Item Affected required"); return; }
    if (!description.trim()) { setFormError("Description required"); return; }
    setSubmitting(true);
    try {
      // itemsAffected is now an array from the multi-select dropdown
      // (was previously a free-text comma-separated input).
      const photoUrls = photoUrlsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const payload = {
        orderId: orderId.trim(),
        ticketId: ticketId.trim(),
        customerName: customerName.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        country: country.trim() || undefined,
        warehouse: warehouse || undefined,
        category, severity,
        itemsAffected,
        description: description.trim(),
        photoUrls,
        videoUrl: videoUrl.trim() || undefined,
        resolution,
        resolutionNotes: resolutionNotes.trim() || undefined,
      };
      if (editingId) {
        const res = await fetch(`/api/logs/issues/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        // Audit trail: keep createdAt, stamp updatedAt + bump the edit count.
        setRecent((cur) => cur.map((x) => x.id === editingId ? { ...x, ...payload, updatedAt: new Date().toISOString(), editCount: (x.editCount || 0) + 1 } : x));
        notify(`Issue ${orderId.trim()} updated`);
        resetForm();
        setSavedLabel(null);
      } else {
        const res = await fetch("/api/logs/issues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setRecent((cur) => [json.row, ...cur]);
        notify(`Order issue logged — ${orderId.trim()}`);
        const saved = orderId.trim();
        resetForm();
        setSavedLabel(`Issue logged for ${saved}`);
      }
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid " + SOFT_BORDER, background: W,
    fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div ref={cardRef} onKeyDown={makeFormKeyHandler(submit)} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>
          {editingId ? "Edit issue — " + orderId : "Log a new issue"}
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={orderInputRef} value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{
                background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700,
                padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed",
                borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5,
              }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="required for traceability" style={inputBase} />
          </div>
        </div>

        {lookupHint && (
          <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: BURG }}>Order line items</div>
            <pre style={{ margin: 0, fontFamily: F.sans, fontSize: 12, whiteSpace: "pre-wrap" }}>{lookupHint.items || "(none)"}</pre>
            <div style={{ marginTop: 6, opacity: 0.6, fontSize: 11 }}>
              Fulfillment: {lookupHint.fulfillment ?? "—"} · Financial: {lookupHint.financial ?? "—"}
            </div>
          </div>
        )}

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Customer name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} />
          </div>
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Category <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={category} onChange={setCategory} options={ISSUE_CATEGORIES} placeholder="Select a category…" />
          </div>
          <div>
            <label style={labelStyle}>Severity <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={severity} onChange={setSeverity} options={ISSUE_SEVERITY} placeholder="Select severity…" />
          </div>
          <div>
            <label style={labelStyle}>Warehouse</label>
            <Combobox value={warehouse} onChange={setWarehouse} options={ISSUE_WAREHOUSES} allowEmpty placeholder="—" />
          </div>
          <div>
            <label style={labelStyle}>Resolution <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={resolution} onChange={setResolution} options={ISSUE_RESOLUTIONS} placeholder="Select resolution…" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items affected (multi-select) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          {/* Simplified SKU list per Aina May 18 — Issues doesn't need
              x1/x2/x3 quantity info; that lives on the Replacement form. */}
          <MultiSelectGroupedDropdowns
            groupedOptions={PRODUCT_CATALOGUE_SIMPLE}
            selected={itemsAffected}
            onChange={setItemsAffected}
            placeholder="Select an item…"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What did the customer report?" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <button onClick={() => setShowMore((v) => !v)} style={{ background: "transparent", border: "none", padding: 0, marginBottom: 14, fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: GOLD, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", transform: showMore ? "rotate(90deg)" : "none", transition: "transform 0.15s", fontSize: 10 }}>▸</span>
          {showMore ? "Hide extra detail" : "Add more detail"}
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: 0.6 }}>— photos, video, resolution notes</span>
        </button>

        {showMore && (
          <>
            <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Photo URLs (one per line or comma separated)</label>
                <textarea value={photoUrlsText} onChange={(e) => setPhotoUrlsText(e.target.value)} rows={2} placeholder="https://drive.google.com/..." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Video URL</label>
                <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="optional" style={inputBase} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Resolution notes</label>
              <input value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="optional — what was done" style={inputBase} />
            </div>
          </>
        )}

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <FormActionBar note={editingId ? "Editing your entry — saves a new version to the audit trail." : "Under 30 seconds, keyboard first — Tab through, Enter to save."}>
          {savedLabel && !editingId ? (
            <SavedActions
              savedLabel={savedLabel}
              onLogAnother={() => { setSavedLabel(null); orderInputRef.current?.focus(); }}
              onViewRecords={onViewRecords}
            />
          ) : (
            <>
              {editingId && (
                <button onClick={resetForm} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 22px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
                  Cancel
                </button>
              )}
              <button onClick={submit} disabled={submitting} style={{
                background: BURG, color: CREAM, border: "1px solid " + BURG,
                fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px",
                letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99,
                opacity: submitting ? 0.6 : 1,
              }}>{submitting ? "Saving" : editingId ? "Save changes" : "Save Issue"}</button>
            </>
          )}
        </FormActionBar>
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              {scope === "all" ? "Recent — all agents · last 7 days" : "Your recent entries · last 7 days"} ({recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No issues logged in the last 7 days."
              columns={[
                { key: "createdAt",   label: "Date",        width: 70,  render: (r) => <span>{shortDate(r.createdAt)}{r.updatedAt ? <span title={"Edited " + new Date(r.updatedAt).toLocaleString()} style={{ opacity: 0.5 }}> ✎</span> : null}</span> },
                { key: "orderId",     label: "Order",       width: 110 },
                { key: "category",    label: "Category",    width: 130, render: (r) => prettyEnum(r.category, ISSUE_CATEGORIES) },
                { key: "warehouse",   label: "Warehouse",   width: 90,  render: (r) => r.warehouse || "—" },
                { key: "resolution",  label: "Resolution",  width: 110, render: (r) => prettyEnum(r.resolution, ISSUE_RESOLUTIONS) },
                { key: "description", label: "Description",             render: (r) => truncate(r.description, 80) },
                editColumn(role, startEdit),
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Replacement log ──────────────────────────────────────────────

function ReplacementLogPanel({ role, onViewRecords }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  const [warehouse, setWarehouse] = useState("");
  // Two-tier multi-select per Aina's feedback (May 13).
  // `reasonMains` holds main-reason `value` strings.
  // `reasonSubs` holds the sub-reason label strings (free-form).
  const [reasonMains, setReasonMains] = useState([]);
  const [reasonSubs, setReasonSubs] = useState([]);
  // Items affected — separate field. Shared SKU list with Issues tab.
  const [itemsAffected, setItemsAffected] = useState([]);
  const [originalOrder, setOriginalOrder] = useState("");
  const [details, setDetails] = useState("");
  const [courier, setCourier] = useState("");
  // Solution = free-text (renamed from "Status" per Aina's feedback)
  const [solution, setSolution] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => replacementsSeed()); // instant render — refreshed silently
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);
  const [savedLabel, setSavedLabel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const orderInputRef = useRef(null);

  const clearDraft = useFormDraft("draft_replacement", {
    orderId: [orderId, setOrderId], ticketId: [ticketId, setTicketId],
    customerName: [customerName, setCustomerName], customerEmail: [customerEmail, setCustomerEmail],
    country: [country, setCountry], warehouse: [warehouse, setWarehouse],
    reasonMains: [reasonMains, setReasonMains], reasonSubs: [reasonSubs, setReasonSubs],
    itemsAffected: [itemsAffected, setItemsAffected], originalOrder: [originalOrder, setOriginalOrder],
    details: [details, setDetails], courier: [courier, setCourier], solution: [solution, setSolution],
  });
  useEffect(() => { if (savedLabel && (orderId || details)) setSavedLabel(null); }, [orderId, details]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/replacements?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
      // Warehouse: prefer Shopify's actual fulfillment location, fall back
      // to country-based mapping if the order isn't fulfilled yet.
      const wh = json.warehouse || warehouseFromCountry(json.country);
      if (wh) setWarehouse(wh);
      const items = (json.lineItems ?? [])
        .map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""} x${li.quantity}`)
        .join("\n");
      setLookupHint({ items });
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  function startEdit(r) {
    setEditingId(r.id); setSavedLabel(null);
    setOrderId(r.orderId || ""); setTicketId(r.ticketId || "");
    setCustomerName(r.customerName || ""); setCustomerEmail(r.customerEmail || "");
    setCountry(r.country || ""); setWarehouse(r.warehouse || "");
    setReasonMains(r.reasonMains || []); setReasonSubs(r.reasonSubs || []);
    setItemsAffected(r.itemsAffected || []); setOriginalOrder(r.originalOrder || r.orderId || "");
    setDetails(r.details || ""); setCourier(r.courier || ""); setSolution(r.solution || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEditMode() {
    setEditingId(null);
    setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
    setWarehouse(""); setReasonMains([]); setReasonSubs([]); setItemsAffected([]);
    setOriginalOrder(""); setDetails(""); setCourier(""); setSolution("");
    clearDraft();
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket ID required"); return; }
    if (reasonMains.length === 0) { setFormError("At least one Main Reason required"); return; }
    // Aina May 22: Items Affected now mandatory — replacements need a
    // shippable SKU list, not an empty array.
    if (itemsAffected.length === 0) { setFormError("At least one Item Affected required"); return; }
    // Aina May 18: Original order reference is now mandatory — too many
    // replacement rows landing without it for the warehouse team to
    // reconcile against the source order.
    if (!originalOrder.trim()) { setFormError("Original order reference required"); return; }
    if (!solution.trim()) { setFormError("Solution required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(editingId ? `/api/logs/replacements/${editingId}` : "/api/logs/replacements", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim(),
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          warehouse: warehouse || undefined,
          reasonMains,
          reasonSubs,
          itemsAffected,
          originalOrder: originalOrder.trim(),
          details: details.trim() || undefined,
          courier: courier.trim() || undefined,
          solution: solution.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const saved = orderId.trim();
      const wasEditing = editingId;
      if (wasEditing) {
        setRecent((cur) => cur.map((x) => x.id === wasEditing ? { ...x, ...json.row, id: wasEditing, createdAt: x.createdAt, updatedAt: new Date().toISOString(), editCount: (x.editCount || 0) + 1 } : x));
        notify(`Replacement ${saved} updated`);
      } else {
        setRecent((cur) => [json.row, ...cur]);
        notify(`Replacement logged — ${saved}`);
        setSavedLabel(`Replacement logged for ${saved}`);
      }
      setEditingId(null);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setWarehouse(""); setReasonMains([]); setReasonSubs([]); setItemsAffected([]);
      setOriginalOrder(""); setDetails(""); setCourier("");
      setSolution(""); setLookupHint(null);
      clearDraft();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div onKeyDown={makeFormKeyHandler(submit)} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log a replacement / gift</div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="required for traceability" style={inputBase} />
          </div>
        </div>

        {lookupHint && (
          <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: BURG }}>Original order line items</div>
            <pre style={{ margin: 0, fontFamily: F.sans, fontSize: 12, whiteSpace: "pre-wrap" }}>{lookupHint.items || "(none)"}</pre>
          </div>
        )}

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Warehouse <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(auto-filled from country — override if wrong)</span></label>
          <Combobox value={warehouse} onChange={setWarehouse} options={ISSUE_WAREHOUSES} allowEmpty placeholder="—" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Main reason <span style={{ color: RED, fontWeight: 700 }}>*</span> <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(multi-select — pick all that apply)</span></label>
          <MultiSelectChips
            options={REPLACEMENT_MAIN_REASONS.map((m) => ({ value: m.value, label: m.label }))}
            selected={reasonMains}
            onChange={(next) => {
              setReasonMains(next);
              // Drop any subs whose main is no longer selected
              const validSubs = getSubsForMains(next).map((s) => s.value);
              setReasonSubs((cur) => cur.filter((s) => validSubs.includes(s)));
            }}
          />
        </div>

        {reasonMains.length > 0 && getSubsForMains(reasonMains).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Sub reason / replacement sent <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(multi-select)</span></label>
            <MultiSelectChips
              options={getSubsForMains(reasonMains)}
              selected={reasonSubs}
              onChange={setReasonSubs}
              search={getSubsForMains(reasonMains).length > 20}
              placeholder="Search sub reasons…"
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items affected (multi-select) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <MultiSelectGroupedDropdowns
            groupedOptions={PRODUCT_CATALOGUE}
            selected={itemsAffected}
            onChange={setItemsAffected}
            placeholder="Select an item…"
          />
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Original order reference <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            {/* Aina May 18: was free-text, now a grouped select drawn
                from PRODUCT_CATALOGUE_SIMPLE. Same SKU list the Issues
                tab uses, with <optgroup> per product line. Made
                mandatory same day. */}
            <Combobox
              value={originalOrder}
              onChange={setOriginalOrder}
              options={PRODUCT_CATALOGUE_SIMPLE.flatMap((g) => g.items)}
              placeholder="Select original order…"
            />
          </div>
          <div>
            <label style={labelStyle}>Courier (if known)</label>
            <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="optional" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Details</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} placeholder="What did the customer report? What needs replacing and why?" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Solution <span style={{ color: RED, fontWeight: 700 }}>*</span> <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(new order ID, "XX added to next order", "Ops did manual replacement", etc.)</span></label>
          <input value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="What was actioned?" style={inputBase} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <FormActionBar note="Order lookup fills the customer for you.">
          {savedLabel && !editingId ? (
            <SavedActions savedLabel={savedLabel} onLogAnother={() => setSavedLabel(null)} onViewRecords={onViewRecords} />
          ) : (
          <>
          {editingId && (
            <button onClick={cancelEditMode} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 22px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Cancel</button>
          )}
          <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : editingId ? "Save changes" : "Save Replacement"}</button>
          </>
          )}
        </FormActionBar>
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              {scopeShown === "all" ? "Recent — all agents · last 7 days" : "Your recent entries · last 7 days"} ({recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No replacements logged in the last 7 days."
              columns={[
                { key: "createdAt", label: "Date",      width: 70,  render: (r) => <span>{shortDate(r.createdAt)}{r.updatedAt ? <span title={"Edited " + new Date(r.updatedAt).toLocaleString()} style={{ opacity: 0.5 }}> ✎</span> : null}</span> },
                { key: "orderId",   label: "Order",     width: 110 },
                { key: "reason",    label: "Reason",                render: (r) => {
                  const mains = r.reasonMains?.length > 0
                    ? r.reasonMains.map((m) => prettyEnum(m, REPLACEMENT_REASONS)).join(", ")
                    : prettyEnum(r.reason, REPLACEMENT_REASONS);
                  return truncate(mains, 60);
                } },
                { key: "warehouse", label: "Warehouse", width: 90,  render: (r) => r.warehouse || "—" },
                { key: "items",     label: "Items",                 render: (r) => {
                  const items = (r.itemsAffected?.length > 0 ? r.itemsAffected : r.itemsToShip) || [];
                  return items.length > 0 ? truncate(items.join(", "), 80) : "—";
                } },
                { key: "solution",  label: "Solution",              render: (r) => truncate(r.solution || r.details, 80) },
                editColumn(role, startEdit),
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Module A — 3PL Claim log ─────────────────────────────────────
// Any agent can file. Items map to Parcelline landed costs; claims are
// batched weekly as CSV to Parcelline's claims team.

function ClaimLogPanel({ role, onViewRecords }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]); // [{ sku, qty }]
  const [status, setStatus] = useState("draft");
  const [evidenceText, setEvidenceText] = useState("");
  const [notes, setNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [savedLabel, setSavedLabel] = useState(null);
  const [recent, setRecent] = useState(() => claimsSeed()); // instant render — refreshed silently
  const [loading, setLoading] = useState(false);

  const clearDraft = useFormDraft("draft_claim", {
    orderId: [orderId, setOrderId], ticketId: [ticketId, setTicketId],
    warehouse: [warehouse, setWarehouse], category: [category, setCategory],
    items: [items, setItems], status: [status, setStatus],
    evidenceText: [evidenceText, setEvidenceText], notes: [notes, setNotes],
  });
  useEffect(() => { if (savedLabel && (orderId || notes)) setSavedLabel(null); }, [orderId, notes]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/claims?limit=30");
      const json = await res.json();
      if (res.ok) setRecent(json.rows ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const wh = json.warehouse || warehouseFromCountry(json.country);
      if (wh) setWarehouse(wh);
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  function toggleSku(sku) {
    setItems((cur) => cur.some((i) => i.sku === sku) ? cur.filter((i) => i.sku !== sku) : [...cur, { sku, qty: 1 }]);
  }
  function setQty(sku, qty) {
    const q = Math.max(1, Math.min(99, Number(qty) || 1));
    setItems((cur) => cur.map((i) => i.sku === sku ? { ...i, qty: q } : i));
  }
  const total = claimTotal(items);
  const currency = warehouse ? currencyForWarehouse(warehouse) : "AUD";

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    if (!warehouse) { setFormError("Warehouse required"); return; }
    if (!category) { setFormError("Category required"); return; }
    if (items.length === 0) { setFormError("At least one item required"); return; }
    setSubmitting(true);
    try {
      const evidenceUrls = evidenceText.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
      const nextRef = "PLC-" + (2418 + recent.filter((r) => String(r.id).includes("demo-clm-1")).length + 1);
      const res = await fetch("/api/logs/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimRef: nextRef,
          orderId: orderId.trim(),
          ticketId: ticketId.trim(),
          warehouse, category, items, status,
          claimTotalValue: total,
          currency: currencyForWarehouse(warehouse),
          evidenceUrls,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const saved = orderId.trim();
      setOrderId(""); setTicketId(""); setWarehouse(""); setCategory("");
      setItems([]); setStatus("draft"); setEvidenceText(""); setNotes("");
      clearDraft();
      setRecent((cur) => [json.row, ...cur]);
      notify(`Claim filed — ${saved} (${formatLedgerMoney(total)})`);
      setSavedLabel(`Claim filed for ${saved}`);
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  // ── Weekly batch: everything non-draft from the last 7 days ──
  const batch = recent.filter((r) => r.status !== "draft" && r.status !== "rejected" && (Date.now() - new Date(r.createdAt).getTime()) < 7 * 86400000);
  const byWarehouse = {};
  for (const c of batch) (byWarehouse[c.warehouse] = byWarehouse[c.warehouse] || []).push(c);
  const currencyTotals = {};
  for (const c of batch) currencyTotals[c.currency] = Math.round(((currencyTotals[c.currency] || 0) + (c.claimTotalValue || 0)) * 100) / 100;

  function weekCommencing() {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }

  function downloadBatchCSV() {
    const esc = (v) => /[",\n]/.test(String(v ?? "")) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? "");
    const header = ["claim_ref", "order_id", "warehouse", "sku", "qty", "unit_cost", "claim_total", "currency", "category", "evidence_url", "notes"].join(",");
    const lines = [];
    for (const c of batch) {
      for (const it of c.items || []) {
        lines.push([
          c.claimRef, c.orderId, c.warehouse, it.sku, it.qty,
          skuCost(it.sku).toFixed(2), (c.claimTotalValue ?? claimTotal(c.items)).toFixed(2),
          c.currency, prettyEnum(c.category, CLAIM_CATEGORIES),
          (c.evidenceUrls || [])[0] || "", c.notes || "",
        ].map(esc).join(","));
      }
    }
    const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUME_parcelline_claims_wc_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Weekly claims batch downloaded");
  }

  function emailBatch() {
    const subject = encodeURIComponent(`LUMÉ weekly claims batch — w/c ${weekCommencing()}`);
    const totalsLine = Object.entries(currencyTotals).map(([cur, v]) => `${cur} ${v.toFixed(2)}`).join(" · ");
    const body = encodeURIComponent(
      `Hi Parcelline claims team,\n\nAttached is this week's LUMÉ claims batch — ${batch.length} claims (${totalsLine}).\nCSV generated from the LUMÉ CX Hub.\n\nWarmly,\nLUMÉ CX`
    );
    window.location.href = `mailto:claims@parcelline.com?cc=ops@lumebeauty.com&subject=${subject}&body=${body}`;
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div onKeyDown={makeFormKeyHandler(submit)} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>File a Parcelline claim</div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 4821" style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Warehouse <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={warehouse} onChange={setWarehouse} options={ISSUE_WAREHOUSES} placeholder="Auto-fills from lookup" />
          </div>
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Category <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={category} onChange={setCategory} options={CLAIM_CATEGORIES} placeholder="What went wrong…" />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <Combobox value={status} onChange={setStatus} options={CLAIM_STATUSES} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items <span style={{ color: RED, fontWeight: 700 }}>*</span> <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(mapped to Parcelline landed cost)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: items.length ? 12 : 0 }}>
            {SKU_COSTS.map((sk) => {
              const on = items.some((i) => i.sku === sk.sku);
              return (
                <button key={sk.sku} onClick={() => toggleSku(sk.sku)} style={{ background: on ? BURG : "transparent", color: on ? CREAM : BURG, border: "1px solid " + (on ? BURG : SOFT_BORDER), fontFamily: F.sans, fontSize: 12, padding: "7px 14px", borderRadius: 99, cursor: "pointer" }}>
                  {sk.label} · ${sk.cost.toFixed(2)}
                </button>
              );
            })}
          </div>
          {items.length > 0 && (
            <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px" }}>
              {items.map((it) => {
                const sk = SKU_COSTS.find((x) => x.sku === it.sku);
                return (
                  <div key={it.sku} style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0", fontFamily: F.sans, fontSize: 13 }}>
                    <span style={{ flex: 1, color: BURG, fontWeight: 600 }}>{sk?.label} <span style={{ opacity: 0.5, fontWeight: 400 }}>({it.sku})</span></span>
                    <span style={{ opacity: 0.6 }}>${skuCost(it.sku).toFixed(2)} ×</span>
                    <input type="number" min={1} max={99} value={it.qty} onChange={(e) => setQty(it.sku, e.target.value)} style={{ width: 56, padding: "5px 8px", borderRadius: 6, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 13, textAlign: "center" }} />
                    <span style={{ width: 70, textAlign: "right", color: BURG, fontWeight: 700 }}>${(skuCost(it.sku) * it.qty).toFixed(2)}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px dashed " + SOFT_BORDER, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "flex-end", fontFamily: F.sans, fontSize: 13 }}>
                <span style={{ opacity: 0.6, marginRight: 10 }}>Claim total</span>
                <span style={{ color: BURG, fontWeight: 800 }}>{currency} {total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Evidence URLs (one per line)</label>
            <textarea value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} rows={2} placeholder="https://drive.google.com/…" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What Parcelline needs to approve this first pass." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <FormActionBar note="Claims batch to Parcelline every Monday — file as you go.">
          {savedLabel ? (
            <SavedActions savedLabel={savedLabel} onLogAnother={() => setSavedLabel(null)} onViewRecords={onViewRecords} />
          ) : (
          <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : "File Claim"}</button>
          )}
        </FormActionBar>
      </div>

      {/* ── This week's batch — what goes to Parcelline on Monday ── */}
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600 }}>This week's batch — {batch.length} claim{batch.length === 1 ? "" : "s"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginTop: 2 }}>
              {Object.entries(currencyTotals).map(([cur, v]) => `${cur} ${v.toFixed(2)}`).join(" · ") || "Nothing queued yet"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={downloadBatchCSV} disabled={batch.length === 0} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "9px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: batch.length ? "pointer" : "not-allowed", borderRadius: 99, opacity: batch.length ? 1 : 0.5 }}>Download CSV</button>
            <button onClick={emailBatch} disabled={batch.length === 0} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "9px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: batch.length ? "pointer" : "not-allowed", borderRadius: 99, opacity: batch.length ? 1 : 0.5 }}>Email to Parcelline</button>
          </div>
        </div>
        {Object.entries(byWarehouse).map(([wh, claims]) => (
          <div key={wh} style={{ padding: "8px 0", borderTop: "1px solid #F0EBE3" }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>{wh}</div>
            {claims.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "baseline", fontFamily: F.sans, fontSize: 12.5, padding: "3px 0", flexWrap: "wrap" }}>
                <span style={{ color: BURG, fontWeight: 700, width: 74 }}>{c.claimRef}</span>
                <span style={{ opacity: 0.7, width: 96 }}>{c.orderId}</span>
                <span style={{ flex: 1, minWidth: 140 }}>{prettyEnum(c.category, CLAIM_CATEGORIES)} — {(c.items || []).map((i) => `${i.sku} ×${i.qty}`).join(", ")}</span>
                <span style={{ color: BURG, fontWeight: 700 }}>{c.currency} {(c.claimTotalValue ?? 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Recent claims · last 7 days ({recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No claims filed in the last 7 days."
              columns={[
                { key: "createdAt", label: "Date",     width: 70,  render: (r) => shortDate(r.createdAt) },
                { key: "claimRef",  label: "Claim",    width: 90 },
                { key: "orderId",   label: "Order",    width: 100 },
                { key: "category",  label: "Category", width: 170, render: (r) => prettyEnum(r.category, CLAIM_CATEGORIES) },
                { key: "items",     label: "Items",                render: (r) => (r.items || []).map((i) => `${i.sku} ×${i.qty}`).join(", ") },
                { key: "claimTotalValue", label: "Total", width: 100, render: (r) => `${r.currency} ${(r.claimTotalValue ?? 0).toFixed(2)}` },
                { key: "status",    label: "Status",   width: 190, render: (r) => prettyEnum(r.status, CLAIM_STATUSES) },
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Cancellation log ─────────────────────────────────────────────

function CancellationLogPanel({ role }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  const [cancellationType, setCancellationType] = useState(CANCELLATION_TYPES[0].value);
  const [scope, setScope] = useState("subscription");
  const [notes, setNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => cancellationsSeed()); // instant render — refreshed silently
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/cancellations?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          cancellationType, scope,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setCancellationType(CANCELLATION_TYPES[0].value); setScope("subscription"); setNotes("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log a cancellation</div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket #</label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="optional" style={inputBase} />
          </div>
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Reason</label>
            <Combobox value={cancellationType} onChange={setCancellationType} options={CANCELLATION_TYPES} />
          </div>
          <div>
            <label style={labelStyle}>What was cancelled</label>
            <Combobox value={scope} onChange={setScope} options={CANCELLATION_SCOPES} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything worth capturing — context, save attempt, etc." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : "Save Cancellation"}</button>
      </div>

      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        {scopeShown === "all" ? "Recent — all agents" : "Your recent entries"} ({recent.length})
      </div>
      {recent.length === 0 && !loading && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5, padding: "16px 0" }}>No cancellations logged yet.</div>
      )}
      {recent.map((r) => (
        <div key={r.id} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>{r.orderId}</div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, letterSpacing: 1 }}>{new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
            {prettyEnum(r.cancellationType, CANCELLATION_TYPES)} · {prettyEnum(r.scope, CANCELLATION_SCOPES)}
          </div>
          {r.notes && <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.5 }}>{r.notes}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Cancel — No Refund log ───────────────────────────────────────
// Added 2026-05-15 per Aina's feedback. For cases where we cancelled
// an order but did NOT issue a cash refund — typically because we
// shipped a replacement order instead. All four fields mandatory.

function CancelNoRefundLogPanel({ role }) {
  const [cancelledOrderId, setCancelledOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [replacementOrderId, setReplacementOrderId] = useState("");
  const [reasonNotRefunded, setReasonNotRefunded] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => cancelNoRefundSeed()); // instant render — refreshed silently
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/cancel-no-refund?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function submit() {
    setFormError(null);
    if (!cancelledOrderId.trim())   { setFormError("Cancelled order # required"); return; }
    if (!ticketId.trim())           { setFormError("Gorgias ticket # required"); return; }
    if (!replacementOrderId.trim()) { setFormError("Replacement order # required"); return; }
    if (!reasonNotRefunded.trim())  { setFormError("Reason for not refunding required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs/cancel-no-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelledOrderId:   cancelledOrderId.trim(),
          ticketId:           ticketId.trim(),
          replacementOrderId: replacementOrderId.trim(),
          reasonNotRefunded:  reasonNotRefunded.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setCancelledOrderId(""); setTicketId(""); setReplacementOrderId("");
      setReasonNotRefunded(""); setNotes("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };
  const reqMark = <span style={{ color: RED, fontWeight: 700 }}>*</span>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 6 }}>Log a cancel — no refund</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.6, marginBottom: 18 }}>
          For orders we cancelled where the customer didn't receive a cash refund — typically because we sent a replacement order instead.
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Cancelled order # {reqMark}</label>
            <input value={cancelledOrderId} onChange={(e) => setCancelledOrderId(e.target.value)} placeholder="#LME-10500" style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # {reqMark}</label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Replacement order # {reqMark}</label>
          <input value={replacementOrderId} onChange={(e) => setReplacementOrderId(e.target.value)} placeholder="#LME-10501" style={inputBase} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Reason for not refunding {reqMark}</label>
          <textarea value={reasonNotRefunded} onChange={(e) => setReasonNotRefunded(e.target.value)} rows={2} placeholder="e.g. Replacement shipped at no extra cost / store credit issued / customer accepted exchange" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything else worth capturing (optional)" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : "Save Entry"}</button>
      </div>

      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        {scopeShown === "all" ? "Recent — all agents" : "Your recent entries"} ({recent.length})
      </div>
      {recent.length === 0 && !loading && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55 }}>None logged yet.</div>
      )}
      {recent.length > 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12 }}>
            <thead>
              <tr style={{ background: CREAM }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Cancelled</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Replacement</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Ticket</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid " + SOFT_BORDER : "none" }}>
                  <td style={{ padding: "10px 12px", color: INK, opacity: 0.7, whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600, whiteSpace: "nowrap" }}>{r.cancelledOrderId}</td>
                  <td style={{ padding: "10px 12px", color: BURG, whiteSpace: "nowrap" }}>{r.replacementOrderId}</td>
                  <td style={{ padding: "10px 12px", color: INK, opacity: 0.7, whiteSpace: "nowrap" }}>{r.ticketId}</td>
                  <td style={{ padding: "10px 12px", color: INK }}>{r.reasonNotRefunded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Feedback log ─────────────────────────────────────────────────

function FeedbackLogPanel({ role, onViewRecords }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  // Aina May 22 — theme and relatedTeam now mandatory; both start empty
  // so the agent picks a value rather than defaulting through.
  const [theme, setTheme] = useState("");
  const [relatedTeam, setRelatedTeam] = useState("");
  const [details, setDetails] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => feedbackSeed()); // instant render — refreshed silently
  const [savedLabel, setSavedLabel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  const clearDraft = useFormDraft("draft_feedback", {
    orderId: [orderId, setOrderId], ticketId: [ticketId, setTicketId],
    customerName: [customerName, setCustomerName], customerEmail: [customerEmail, setCustomerEmail],
    country: [country, setCountry], theme: [theme, setTheme],
    relatedTeam: [relatedTeam, setRelatedTeam], details: [details, setDetails], suggestion: [suggestion, setSuggestion],
  });
  useEffect(() => { if (savedLabel && (ticketId || details)) setSavedLabel(null); }, [ticketId, details]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/feedback?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  function startEdit(r) {
    setEditingId(r.id); setSavedLabel(null);
    setOrderId(r.orderId || ""); setTicketId(r.ticketId || "");
    setCustomerName(r.customerName || ""); setCustomerEmail(r.customerEmail || "");
    setCountry(r.country || ""); setTheme(r.theme || "");
    setRelatedTeam(r.relatedTeam || ""); setDetails(r.details || ""); setSuggestion(r.suggestion || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEditMode() {
    setEditingId(null);
    setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
    setTheme(""); setRelatedTeam(""); setDetails(""); setSuggestion("");
    clearDraft();
  }

  async function submit() {
    setFormError(null);
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    // Aina May 22 — Theme + Related Team + customer-verbatim now mandatory.
    if (!theme) { setFormError("Theme required"); return; }
    if (!relatedTeam) { setFormError("Related team required"); return; }
    if (!details.trim()) { setFormError("What did the customer say? required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(editingId ? `/api/logs/feedback/${editingId}` : "/api/logs/feedback", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim() || undefined,
          ticketId: ticketId.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          theme,
          relatedTeam: relatedTeam || undefined,
          details: details.trim(),
          suggestion: suggestion.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const savedTicket = ticketId.trim();
      const wasEditing = editingId;
      if (wasEditing) {
        setRecent((cur) => cur.map((x) => x.id === wasEditing ? { ...x, ...json.row, id: wasEditing, createdAt: x.createdAt, updatedAt: new Date().toISOString(), editCount: (x.editCount || 0) + 1 } : x));
        notify("Feedback entry updated");
      } else {
        setRecent((cur) => [json.row, ...cur]);
        notify(`Feedback logged — ticket #${savedTicket}`);
        setSavedLabel("Feedback logged");
      }
      setEditingId(null);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setTheme(""); setRelatedTeam(""); setDetails(""); setSuggestion("");
      clearDraft();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div onKeyDown={makeFormKeyHandler(submit)} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log customer feedback</div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID (optional — IG DM has no order)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Theme <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={theme} onChange={setTheme} options={FEEDBACK_THEMES} placeholder="Select a theme…" />
          </div>
          <div>
            <label style={labelStyle}>Related team <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox value={relatedTeam} onChange={setRelatedTeam} options={FEEDBACK_TEAMS} placeholder="Select a team…" />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>What did the customer say? <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Capture the feedback as faithfully as you can." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Suggested action / follow-up (optional)</label>
          <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={2} placeholder="What should the team do with this?" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <FormActionBar note="Feedback feeds the weekly report and VoC automatically.">
          {savedLabel && !editingId ? (
            <SavedActions savedLabel={savedLabel} onLogAnother={() => setSavedLabel(null)} onViewRecords={onViewRecords} />
          ) : (
          <>
          {editingId && (
            <button onClick={cancelEditMode} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 22px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Cancel</button>
          )}
          <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : editingId ? "Save changes" : "Save Feedback"}</button>
          </>
          )}
        </FormActionBar>
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              {scopeShown === "all" ? "Recent — all agents · last 7 days" : "Your recent entries · last 7 days"} ({recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No feedback logged in the last 7 days."
              columns={[
                { key: "createdAt",    label: "Date",  width: 70,  render: (r) => <span>{shortDate(r.createdAt)}{r.updatedAt ? <span title={"Edited " + new Date(r.updatedAt).toLocaleString()} style={{ opacity: 0.5 }}> ✎</span> : null}</span> },
                { key: "orderId",      label: "Order", width: 110, render: (r) => r.orderId || "—" },
                { key: "theme",        label: "Theme", width: 110, render: (r) => prettyEnum(r.theme, FEEDBACK_THEMES) },
                { key: "relatedTeam",  label: "Team",  width: 90,  render: (r) => r.relatedTeam || "—" },
                { key: "details",      label: "Details",           render: (r) => truncate(r.details, 100) },
                { key: "suggestion",   label: "Suggestion",        render: (r) => truncate(r.suggestion, 80) },
                editColumn(role, startEdit),
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Ops Order Request log ───────────────────────────────────────

function OrderRequestLogPanel({ role }) {
  const isOpsRole = role === "Ops";
  const canEdit = isOpsRole || (role && ["Lead Agent","Manager","Admin","Owner"].includes(role));
  const [region, setRegion] = useState("US");
  const [orderRef, setOrderRef] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [omsOrderNumber, setOmsOrderNumber] = useState("");
  const [skusText, setSkusText] = useState("");
  const [dispatchWarehouse, setDispatchWarehouse] = useState("");
  const [shipCarrier, setShipCarrier] = useState("");
  const [awb, setAwb] = useState("");
  const [shipDate, setShipDate] = useState("");
  const [sent, setSent] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [shipToAddress1, setShipToAddress1] = useState("");
  const [shipToAddress2, setShipToAddress2] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [shipToCountry, setShipToCountry] = useState("");
  const [shipToPhone, setShipToPhone] = useState("");
  const [shipToEmail, setShipToEmail] = useState("");
  const [itemsDescription, setItemsDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => orderRequestsSeed()); // instant render — refreshed silently
  const [scopeShown, setScopeShown] = useState("own");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterPending, setFilterPending] = useState(isOpsRole);
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (filterRegion) params.set("region", filterRegion);
      if (filterPending) params.set("sent", "0");
      const res = await fetch(`/api/logs/order-requests?${params}`);
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, [filterRegion, filterPending]);

  async function lookupOrder() {
    if (!orderRef.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderRef.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const ship = json.shipping ?? {};
      if (ship.name || json.customerName) setRecipientName(ship.name || json.customerName || "");
      if (ship.email || json.customerEmail) setShipToEmail(ship.email || json.customerEmail || "");
      if (ship.phone || json.customerPhone) setShipToPhone(ship.phone || json.customerPhone || "");
      if (ship.address1) setShipToAddress1(ship.address1);
      if (ship.address2) setShipToAddress2(ship.address2);
      if (ship.city) setShipToCity(ship.city);
      if (ship.state) setShipToState(ship.state);
      if (ship.zip) setShipToZip(ship.zip);
      if (ship.country || json.country) setShipToCountry(ship.country || json.country || "");
      if (json.lineItems?.length) {
        setItemsDescription(json.lineItems.map((li) => `${li.quantity}x ${li.title}${li.variantTitle ? " — " + li.variantTitle : ""}`).join("\n"));
      }
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  async function submit() {
    setFormError(null);
    if (!orderRef.trim()) { setFormError("Order ref required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    if (!recipientName.trim()) { setFormError("Recipient name required"); return; }
    if (!itemsDescription.trim()) { setFormError("Items description required"); return; }
    setSubmitting(true);
    try {
      const skus = skusText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/logs/order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          requestedBy: requestedBy.trim() || undefined,
          ticketId: ticketId.trim() || undefined,
          orderRef: orderRef.trim(),
          referenceNumber: referenceNumber.trim() || undefined,
          omsOrderNumber: omsOrderNumber.trim() || undefined,
          skus,
          dispatchWarehouse: dispatchWarehouse.trim() || undefined,
          shipCarrier: shipCarrier.trim() || undefined,
          awb: awb.trim() || undefined,
          shipDate: shipDate || undefined,
          sent,
          recipientName: recipientName.trim(),
          shipToAddress1: shipToAddress1.trim() || undefined,
          shipToAddress2: shipToAddress2.trim() || undefined,
          shipToCity: shipToCity.trim() || undefined,
          shipToState: shipToState.trim() || undefined,
          shipToZip: shipToZip.trim() || undefined,
          shipToCountry: shipToCountry.trim() || undefined,
          shipToPhone: shipToPhone.trim() || undefined,
          shipToEmail: shipToEmail.trim() || undefined,
          itemsDescription: itemsDescription.trim(),
          status,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderRef(""); setTicketId(""); setReferenceNumber(""); setOmsOrderNumber("");
      setSkusText(""); setDispatchWarehouse(""); setShipCarrier(""); setAwb("");
      setShipDate(""); setSent(false); setRecipientName("");
      setShipToAddress1(""); setShipToAddress2(""); setShipToCity(""); setShipToState("");
      setShipToZip(""); setShipToCountry(""); setShipToPhone(""); setShipToEmail("");
      setItemsDescription(""); setStatus("pending"); setNotes(""); setRequestedBy("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      {!isOpsRole && (
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Request Ops to ship a replacement</div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Warehouse</label>
            <Combobox value={region} onChange={setRegion} options={OPS_REGIONS} />
          </div>
          <div>
            <label style={labelStyle}>Order ref (auto-fills recipient)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderRef} onChange={(e) => setOrderRef(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderRef.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderRef.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderRef.trim() && !lookupLoading ? 1 : 0.5 }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items to ship</label>
          <textarea value={itemsDescription} onChange={(e) => setItemsDescription(e.target.value)} rows={3} placeholder="1x Smooth Serum&#10;1x Repair Serum" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, marginTop: 6 }}>Recipient</div>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Name</label><input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={shipToEmail} onChange={(e) => setShipToEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Phone</label><input value={shipToPhone} onChange={(e) => setShipToPhone(e.target.value)} style={inputBase} /></div>
        </div>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Address line 1</label><input value={shipToAddress1} onChange={(e) => setShipToAddress1(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Address line 2</label><input value={shipToAddress2} onChange={(e) => setShipToAddress2(e.target.value)} style={inputBase} /></div>
        </div>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>City</label><input value={shipToCity} onChange={(e) => setShipToCity(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>State</label><input value={shipToState} onChange={(e) => setShipToState(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>ZIP</label><input value={shipToZip} onChange={(e) => setShipToZip(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={shipToCountry} onChange={(e) => setShipToCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, marginTop: 12 }}>Ops detail (filled by Ops once shipped)</div>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Dispatch warehouse</label><input value={dispatchWarehouse} onChange={(e) => setDispatchWarehouse(e.target.value)} placeholder="SYD-01 (Parcelline)" style={inputBase} /></div>
          <div><label style={labelStyle}>Ship carrier</label><input value={shipCarrier} onChange={(e) => setShipCarrier(e.target.value)} placeholder="FedEx / asendia / etc." style={inputBase} /></div>
          <div><label style={labelStyle}>Tracking AWB#</label><input value={awb} onChange={(e) => setAwb(e.target.value)} style={inputBase} /></div>
        </div>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Reference #</label><input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="ST-20260102-02" style={inputBase} /></div>
          <div><label style={labelStyle}>OMS SO #</label><input value={omsOrderNumber} onChange={(e) => setOmsOrderNumber(e.target.value)} placeholder="PL-88412" style={inputBase} /></div>
          <div><label style={labelStyle}>Ship date</label><input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} style={inputBase} /></div>
          <div>
            <label style={labelStyle}>Status</label>
            <Combobox value={status} onChange={setStatus} options={OPS_STATUSES} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>SKUs (one per line)</label>
          <textarea value={skusText} onChange={(e) => setSkusText(e.target.value)} rows={2} placeholder="Smooth Serum x1&#10;Repair Serum x1" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" }}>
            <input type="checkbox" checked={sent} onChange={(e) => setSent(e.target.checked)} />
            <span>Marked as sent</span>
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything Ops needs to know" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <FormActionBar note="Everything Parcelline needs to dispatch.">
          <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : "Submit Ops Request"}</button>
        </FormActionBar>
      </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          {isOpsRole ? "Pending fulfillment queue" : (scopeShown === "all" ? "Recent — all agents" : "Your recent entries")} ({recent.length})
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ width: 170 }}>
            <Combobox value={filterRegion} onChange={setFilterRegion} options={[{ value: "", label: "All regions" }, ...OPS_REGIONS]} style={{ padding: "6px 10px", fontSize: 12 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" }}>
            <input type="checkbox" checked={filterPending} onChange={(e) => setFilterPending(e.target.checked)} />
            <span>Not yet sent</span>
          </label>
        </div>
      </div>
      {recent.length === 0 && !loading && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5, padding: "16px 0" }}>No requests yet for this filter.</div>
      )}
      {recent.map((r) => (
        <OrderRequestCard key={r.id} row={r} canEdit={canEdit} onSaved={loadRecent} />
      ))}
    </div>
  );
}

function OrderRequestCard({ row, canEdit, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEdit() {
    setDraft({
      ...row,
      shipDate: row.shipDate ? new Date(row.shipDate).toISOString().slice(0, 10) : "",
      skusText: (row.skus || []).join("\n"),
    });
    setError(null);
    setEditing(true);
  }
  function cancel() { setEditing(false); setError(null); }
  function set(key, val) { setDraft((d) => ({ ...d, [key]: val })); }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        dispatchWarehouse: draft.dispatchWarehouse ?? null,
        shipCarrier: draft.shipCarrier ?? null,
        awb: draft.awb ?? null,
        referenceNumber: draft.referenceNumber ?? null,
        omsOrderNumber: draft.omsOrderNumber ?? null,
        skus: (draft.skusText ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
        shipDate: draft.shipDate || null,
        sent: !!draft.sent,
        status: draft.status,
        notes: draft.notes ?? null,
        recipientName: draft.recipientName,
        shipToAddress1: draft.shipToAddress1 ?? null,
        shipToAddress2: draft.shipToAddress2 ?? null,
        shipToCity: draft.shipToCity ?? null,
        shipToState: draft.shipToState ?? null,
        shipToZip: draft.shipToZip ?? null,
        shipToCountry: draft.shipToCountry ?? null,
        shipToPhone: draft.shipToPhone ?? null,
        shipToEmail: draft.shipToEmail ?? null,
        itemsDescription: draft.itemsDescription,
      };
      const res = await fetch(`/api/logs/order-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setEditing(false);
      onSaved?.();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const inputBase = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 12, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3, display: "block" };

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>
          {row.orderRef}
          <span style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2, padding: "2px 8px", border: "1px solid " + GOLD, borderRadius: 99, marginLeft: 8 }}>{row.region}</span>
          {row.sent && <span style={{ fontFamily: F.sans, fontSize: 10, color: "#2a7a2a", fontWeight: 800, letterSpacing: 1.5, padding: "2px 8px", border: "1px solid #2a7a2a", borderRadius: 99, marginLeft: 6 }}>SENT</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, letterSpacing: 1 }}>{new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
          {canEdit && !editing && (
            <button onClick={startEdit} style={{ background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "4px 10px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Edit</button>
          )}
        </div>
      </div>

      {!editing ? (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
            {row.status}{row.dispatchWarehouse ? " · " + row.dispatchWarehouse : ""}{row.shipCarrier ? " · " + row.shipCarrier : ""}{row.awb ? " · " + row.awb : ""}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.8, marginTop: 4 }}>→ {row.recipientName}{row.shipToCity ? ", " + row.shipToCity : ""}{row.shipToCountry ? ", " + row.shipToCountry : ""}</div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{row.itemsDescription}</div>
        </>
      ) : (
        <div style={{ marginTop: 12, padding: "12px 14px", background: CREAM, borderRadius: 8 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Ops fulfillment detail</div>
          <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Dispatch warehouse</label><input value={draft.dispatchWarehouse ?? ""} onChange={(e) => set("dispatchWarehouse", e.target.value)} placeholder="SYD-01 (Parcelline)" style={inputBase} /></div>
            <div><label style={labelStyle}>Ship carrier</label><input value={draft.shipCarrier ?? ""} onChange={(e) => set("shipCarrier", e.target.value)} placeholder="FedEx" style={inputBase} /></div>
            <div><label style={labelStyle}>Tracking AWB#</label><input value={draft.awb ?? ""} onChange={(e) => set("awb", e.target.value)} style={inputBase} /></div>
          </div>
          <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Reference #</label><input value={draft.referenceNumber ?? ""} onChange={(e) => set("referenceNumber", e.target.value)} placeholder="ST-20260102-02" style={inputBase} /></div>
            <div><label style={labelStyle}>OMS SO #</label><input value={draft.omsOrderNumber ?? ""} onChange={(e) => set("omsOrderNumber", e.target.value)} placeholder="PL-88412" style={inputBase} /></div>
            <div><label style={labelStyle}>Ship date</label><input type="date" value={draft.shipDate ?? ""} onChange={(e) => set("shipDate", e.target.value)} style={inputBase} /></div>
            <div>
              <label style={labelStyle}>Status</label>
              <Combobox value={draft.status} onChange={(v) => set("status", v)} options={OPS_STATUSES} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>SKUs (one per line)</label>
            <textarea value={draft.skusText ?? ""} onChange={(e) => set("skusText", e.target.value)} rows={2} style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>

          <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 14, marginBottom: 8 }}>Recipient</div>
          <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Name</label><input value={draft.recipientName ?? ""} onChange={(e) => set("recipientName", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Email</label><input value={draft.shipToEmail ?? ""} onChange={(e) => set("shipToEmail", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Phone</label><input value={draft.shipToPhone ?? ""} onChange={(e) => set("shipToPhone", e.target.value)} style={inputBase} /></div>
          </div>
          <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Address 1</label><input value={draft.shipToAddress1 ?? ""} onChange={(e) => set("shipToAddress1", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Address 2</label><input value={draft.shipToAddress2 ?? ""} onChange={(e) => set("shipToAddress2", e.target.value)} style={inputBase} /></div>
          </div>
          <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>City</label><input value={draft.shipToCity ?? ""} onChange={(e) => set("shipToCity", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>State</label><input value={draft.shipToState ?? ""} onChange={(e) => set("shipToState", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>ZIP</label><input value={draft.shipToZip ?? ""} onChange={(e) => set("shipToZip", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Country</label><input value={draft.shipToCountry ?? ""} onChange={(e) => set("shipToCountry", e.target.value)} style={inputBase} /></div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Items</label>
            <textarea value={draft.itemsDescription ?? ""} onChange={(e) => set("itemsDescription", e.target.value)} rows={2} style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" }}>
              <input type="checkbox" checked={!!draft.sent} onChange={(e) => set("sent", e.target.checked)} />
              <span>Mark as sent</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={cancel} disabled={saving} style={{ background: "transparent", color: INK, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "8px 16px", letterSpacing: 1, textTransform: "uppercase", cursor: saving ? "wait" : "pointer", borderRadius: 99 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: saving ? "wait" : "pointer", borderRadius: 99, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving" : "Save"}</button>
            </div>
          </div>
          {error && <div style={{ fontFamily: F.sans, fontSize: 12, color: RED, marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Adverse Reaction log ────────────────────────────────────────

function AdverseReactionLogPanel({ role, onViewRecords }) {
  const canSeeList = role && ["Lead Agent", "Manager", "Admin", "Owner"].includes(role);

  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [country, setCountry] = useState("");
  const [patientSameAsCustomer, setPatientSameAsCustomer] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [complaintMethod, setComplaintMethod] = useState("email");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [productsText, setProductsText] = useState("");
  const [lotsText, setLotsText] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  // Aina May 22 — severity now mandatory; start blank so the agent picks.
  const [severity, setSeverity] = useState("");
  const [isSerious, setIsSerious] = useState(false);
  const [escalatedTo, setEscalatedTo] = useState("");
  const [fdaMedwatchFiled, setFdaMedwatchFiled] = useState(false);
  const [mrddNumber, setMrddNumber] = useState("");
  const [returnRequested, setReturnRequested] = useState(false);
  const [rmaNumber, setRmaNumber] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpMethod, setFollowUpMethod] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [status, setStatus] = useState("open");

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState(() => adverseReactionsSeed()); // instant render — refreshed silently
  const [savedLabel, setSavedLabel] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearDraft = useFormDraft("draft_reaction", {
    orderId: [orderId, setOrderId], ticketId: [ticketId, setTicketId],
    customerName: [customerName, setCustomerName], customerEmail: [customerEmail, setCustomerEmail],
    country: [country, setCountry], complaintMethod: [complaintMethod, setComplaintMethod],
    complaintDescription: [complaintDescription, setComplaintDescription],
    productsText: [productsText, setProductsText], lotsText: [lotsText, setLotsText],
    symptoms: [symptoms, setSymptoms], severity: [severity, setSeverity],
    escalatedTo: [escalatedTo, setEscalatedTo], status: [status, setStatus],
  });
  useEffect(() => { if (savedLabel && (orderId || complaintDescription)) setSavedLabel(null); }, [orderId, complaintDescription]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecent() {
    if (!canSeeList) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logs/adverse-reactions?limit=20");
      const json = await res.json();
      if (res.ok) setRecent(json.rows ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      // Per Aina's testing — phone wasn't auto-populating on LOOKUP.
      // API already returns customerPhone; we were just dropping it here.
      if (json.customerPhone) setCustomerPhone(json.customerPhone);
      if (json.country) setCountry(json.country);
      if (json.lineItems?.length) {
        setProductsText(json.lineItems.map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""}`).join("\n"));
      }
      setLookupHint({ items: json.lineItems?.map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""} x${li.quantity}`).join("\n") });
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  function toggleSymptom(s) {
    setSymptoms((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    if (!complaintDescription.trim()) { setFormError("Verbatim complaint description required"); return; }
    // Aina May 22 — products affected / symptoms / severity now mandatory.
    const productsAffected = productsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (productsAffected.length === 0) { setFormError("At least one Product Affected required"); return; }
    if (symptoms.length === 0) { setFormError("Select at least one symptom"); return; }
    if (!severity) { setFormError("Severity required"); return; }
    setSubmitting(true);
    try {
      const lotNumbers = lotsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/logs/adverse-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          country: country.trim() || undefined,
          patientSameAsCustomer,
          patientName: patientName.trim() || undefined,
          patientAge: patientAge.trim() || undefined,
          complaintMethod,
          complaintDescription: complaintDescription.trim(),
          productsAffected, lotNumbers, symptoms,
          severity, isSerious,
          escalatedTo: escalatedTo || undefined,
          fdaMedwatchFiled, mrddNumber: mrddNumber.trim() || undefined,
          returnRequested, rmaNumber: rmaNumber.trim() || undefined,
          followUpAt: followUpAt || undefined,
          followUpMethod: followUpMethod.trim() || undefined,
          followUpNotes: followUpNotes.trim() || undefined,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setCountry("");
      setPatientSameAsCustomer(true); setPatientName(""); setPatientAge("");
      setComplaintMethod("email"); setComplaintDescription("");
      setProductsText(""); setLotsText(""); setSymptoms([]);
      setSeverity(""); setIsSerious(false); setEscalatedTo("");
      setFdaMedwatchFiled(false); setMrddNumber("");
      setReturnRequested(false); setRmaNumber("");
      setFollowUpAt(""); setFollowUpMethod(""); setFollowUpNotes("");
      setStatus("open"); setLookupHint(null);
      clearDraft();
      setRecent((cur) => [json.row, ...cur]);
      notify("Reaction report filed — escalation clock started");
      setSavedLabel("Reaction report filed");
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };
  const checkRow = { display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: "#fff8f5", border: "1px solid " + RED, borderLeft: "3px solid " + RED, borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontFamily: F.sans, fontSize: 12, color: BURG }}>
        <strong style={{ color: RED, letterSpacing: 1, textTransform: "uppercase" }}>Compliance record.</strong>{" "}
        Capture the customer's words verbatim. Do not troubleshoot. Issue full refund. Escalate to Head of CX immediately for any reaction.
      </div>

      <div onKeyDown={makeFormKeyHandler(submit)} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log an adverse reaction</div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>Lookup</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Reported via</label>
            <Combobox value={complaintMethod} onChange={setComplaintMethod} options={AR_METHODS} />
          </div>
        </div>

        {lookupHint?.items && (
          <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: BURG }}>Order items (auto-filled below)</div>
            <pre style={{ margin: 0, fontFamily: F.sans, fontSize: 12, whiteSpace: "pre-wrap" }}>{lookupHint.items}</pre>
          </div>
        )}

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Phone</label><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ background: CREAM, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
          <label style={{ ...checkRow, marginBottom: patientSameAsCustomer ? 0 : 10 }}>
            <input type="checkbox" checked={patientSameAsCustomer} onChange={(e) => setPatientSameAsCustomer(e.target.checked)} />
            <span>Patient is the customer</span>
          </label>
          {!patientSameAsCustomer && (
            <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Patient name</label><input value={patientName} onChange={(e) => setPatientName(e.target.value)} style={inputBase} /></div>
              <div><label style={labelStyle}>Age</label><input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} style={inputBase} /></div>
            </div>
          )}
        </div>

        <FormSection title="Reaction detail" />
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Verbatim complaint <span style={{ color: RED, fontWeight: 700 }}>*</span> (paste exactly what the customer said)</label>
          <textarea value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} rows={4} placeholder="Use the customer's own words. Do not summarise or interpret." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Products affected (one per line) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <textarea value={productsText} onChange={(e) => setProductsText(e.target.value)} rows={2} placeholder="Scalp Serum" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Lot # (one per line, if known)</label>
            <textarea value={lotsText} onChange={(e) => setLotsText(e.target.value)} rows={2} placeholder="optional" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Symptoms (tick all that apply) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AR_COMMON_SYMPTOMS.map((s) => {
              const active = symptoms.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleSymptom(s)} style={{
                  background: active ? BURG : "transparent",
                  color: active ? CREAM : BURG,
                  border: "1px solid " + (active ? BURG : SOFT_BORDER),
                  fontFamily: F.sans, fontSize: 12, fontWeight: 600, padding: "6px 12px",
                  borderRadius: 99, cursor: "pointer",
                }}>{s}</button>
              );
            })}
          </div>
        </div>

        <FormSection title="Severity & escalation" />
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Severity <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <Combobox
              value={severity}
              onChange={(v) => { setSeverity(v); if (v === "serious") setIsSerious(true); }}
              options={AR_SEVERITY}
              placeholder="Select severity…"
              style={{ color: severity === "serious" ? RED : INK, fontWeight: severity === "serious" ? 700 : 400 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Escalated to</label>
            <Combobox value={escalatedTo} onChange={setEscalatedTo} options={[{ value: "", label: "— not yet escalated" }, ...AR_ESCALATION]} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <Combobox value={status} onChange={setStatus} options={AR_STATUS} />
          </div>
        </div>

        <div style={{ background: CREAM, borderRadius: 8, padding: "12px 14px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={checkRow}><input type="checkbox" checked={isSerious} onChange={(e) => setIsSerious(e.target.checked)} /><span>Serious Adverse Event (SAE) — hospitalization, life-threatening, or persistent disability</span></label>
          <label style={checkRow}><input type="checkbox" checked={fdaMedwatchFiled} onChange={(e) => setFdaMedwatchFiled(e.target.checked)} /><span>FDA MEDWATCH form filed</span></label>
          <label style={checkRow}><input type="checkbox" checked={returnRequested} onChange={(e) => setReturnRequested(e.target.checked)} /><span>Customer requested to return product</span></label>
          {(isSerious || fdaMedwatchFiled) && (
            <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
              <div><label style={labelStyle}>MRDD #</label><input value={mrddNumber} onChange={(e) => setMrddNumber(e.target.value)} style={inputBase} /></div>
              <div><label style={labelStyle}>RMA #</label><input value={rmaNumber} onChange={(e) => setRmaNumber(e.target.value)} style={inputBase} /></div>
            </div>
          )}
        </div>

        <FormSection title="Follow-up" />
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Follow-up scheduled</label>
            <input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Follow-up method</label>
            <input value={followUpMethod} onChange={(e) => setFollowUpMethod(e.target.value)} placeholder="email / phone / etc." style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Follow-up notes</label>
          <textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} rows={2} placeholder="Internal notes — what was actioned, what's next" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <FormActionBar note="Compliance record — thoroughness is the feature.">
          {savedLabel ? (
            <SavedActions savedLabel={savedLabel} onLogAnother={() => setSavedLabel(null)} onViewRecords={onViewRecords} />
          ) : (
          <button onClick={submit} disabled={submitting} style={{ background: severity === "serious" ? RED : BURG, color: CREAM, border: "1px solid " + (severity === "serious" ? RED : BURG), fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving" : "File adverse reaction report"}</button>
          )}
        </FormActionBar>
      </div>

      {canSeeList ? (
        (() => {
          const recent7 = filterLast7Days(recent);
          return (
            <>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Recent reports · last 7 days ({recent7.length})
              </div>
              <RecentLogTable
                rows={recent7}
                emptyMessage="No adverse reactions logged in the last 7 days."
                columns={[
                  { key: "createdAt",    label: "Date",     width: 70,  render: (r) => shortDate(r.createdAt) },
                  { key: "orderId",      label: "Order",    width: 130, render: (r) => (
                    <span>
                      {r.orderId}
                      {r.isSerious && (
                        <span style={{ fontFamily: F.sans, fontSize: 9, color: RED, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", border: "1px solid " + RED, borderRadius: 99, marginLeft: 6 }}>SAE</span>
                      )}
                    </span>
                  ) },
                  { key: "severity",     label: "Severity", width: 90, render: (r) => ({ low: "Low", moderate: "Moderate", high: "High", serious: "SERIOUS" })[r.severity] ?? prettyEnum(r.severity, AR_SEVERITY) },
                  { key: "symptoms",     label: "Symptoms",             render: (r) => truncate((r.symptoms || []).join(", "), 80) },
                  { key: "escalatedTo",  label: "Escalated",width: 110, render: (r) => r.escalatedTo || "—" },
                  { key: "status",       label: "Status",   width: 90,  render: (r) => prettyEnum(r.status, AR_STATUS) },
                  editColumn(role, null, "Compliance record — locked for agents. Manager+ can edit in Records."),
                ]}
              />
            </>
          );
        })()
      ) : (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.55, padding: "16px 0" }}>
          Reports list visible to Lead Agent and above. Your submission was filed — check with your Lead if you need to confirm.
        </div>
      )}
    </div>
  );
}

// ─── Playbook Tab ─────────────────────────────────────────────────
const KB_CATEGORIES = ["All", "Safety", "Product", "Product Quality", "Value", "Results", "Shipping", "Subscription", "Partnership"];
// Live Playbook subtabs (May 2026 redesign). Source of truth lives in
// lib/playbook-data.js as PLAYBOOK_SUBTABS_NEW — re-aliased here so the
// rest of the file's local references stay tidy. Old legacy subcomponents
// (PlaybookMacros, PlaybookRules, etc.) remain in the file as orphans
// and can be revived if Cherie wants Macros back later.
const PLAYBOOK_SUBTABS = PLAYBOOK_SUBTABS_NEW;

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK TAB — May 2026 redesign
// Products is default. Tabs in order: Products · Policy · Shipping ·
// Escalation · Voice · Non-Negotiables. Search scopes to the active panel.
// ═══════════════════════════════════════════════════════════════════════════

function PlaybookTab({ role, queryRequest }) {
  const [sub, setSub] = useState("Products");
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (queryRequest?.query != null) setQuery(queryRequest.query);
  }, [queryRequest]);
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };

  // Subtitle that follows the active subtab — orients the reader without
  // a separate heading per panel.
  const subSubtitle = {
    Products: "The full LUMÉ range — know every product so you can answer anything.",
    "How To": "Application guides, usage FAQs, and shipping windows by region.",
    Policy: "Refunds, replacements, subscriptions — navigate every tricky situation.",
    "Tone of Voice": "The LUMÉ way — warm, confident, direct. No jargon, no corporate script.",
    Escalation: "When to flag, who to flag, what to say when you do.",
    "Non-Negotiables": "The lines we never cross. No grey area.",
  };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ HAIR — Playbook · the brand on tap</div>
        <div style={{ fontFamily: F.serif, fontSize: 48, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 8, letterSpacing: -1 }}>
          {sub}
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 18, lineHeight: 1.5 }}>
          {subSubtitle[sub] || ""}
        </div>

        {/* Search bar — scoped to the active panel */}
        <div style={{ position: "relative", marginBottom: 22 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${sub.toLowerCase()}…`}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              fontFamily: F.sans, fontSize: 14,
              background: W,
              border: "1px solid " + SOFT_BORDER,
              borderRadius: 8,
              color: INK,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
          />
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>⌕</div>
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", fontSize: 18, color: INK, opacity: 0.4, cursor: "pointer", padding: 4 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>

        {/* Subtab chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {PLAYBOOK_SUBTABS.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => { setSub(s); setQuery(""); }} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px 96px" }}>
        {sub === "Products"          && <PlaybookProductsNew    query={query} />}
        {sub === "How To"           && <PlaybookShippingNew    query={query} />}
        {sub === "Policy"           && <PlaybookPolicyNew      query={query} />}
        {sub === "Tone of Voice"    && <PlaybookVoiceNew       query={query} />}
        {sub === "Escalation"       && <PlaybookEscalationNew  query={query} />}
        {sub === "Non-Negotiables"  && <PlaybookNonNegNew      query={query} />}
      </div>
    </div>
  );
}

// ─── Shared building blocks for playbook subpanels ────────────────────

// Light markdown renderer for Playbook card bodies: **bold**, *italic*,
// and newlines. Same pattern as the chat renderer but local to keep this
// section self-contained.
function renderPlaybookMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = [];
    let i = 0;
    while (i < line.length) {
      // **bold**
      if (line.startsWith("**", i)) {
        const end = line.indexOf("**", i + 2);
        if (end !== -1) {
          parts.push(<strong key={`b-${li}-${i}`} style={{ color: BURG, fontWeight: 600 }}>{line.slice(i + 2, end)}</strong>);
          i = end + 2;
          continue;
        }
      }
      // *italic*
      if (line[i] === "*" && line[i + 1] !== "*") {
        const end = line.indexOf("*", i + 1);
        if (end !== -1) {
          parts.push(<em key={`i-${li}-${i}`}>{line.slice(i + 1, end)}</em>);
          i = end + 1;
          continue;
        }
      }
      // plain run — accumulate until next marker
      let j = i;
      while (j < line.length && !(line.startsWith("**", j) || (line[j] === "*" && line[j + 1] !== "*"))) j++;
      parts.push(line.slice(i, j));
      i = j;
    }
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// Section header used inside subpanels.
function PlaybookSectionHeader({ children }) {
  return (
    <div style={{
      fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 3.5,
      marginTop: 32, marginBottom: 14, paddingBottom: 8,
      borderBottom: "1px solid " + SOFT_BORDER,
    }}>
      {children}
    </div>
  );
}

// Reusable expandable Q&A card with optional "Why it matters" footer.
function PlaybookQACard({ q, a, tag, why, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: W,
      border: "1px solid " + SOFT_BORDER,
      borderRadius: 8,
      marginBottom: 10,
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "transparent", border: "none",
          padding: "16px 20px", display: "flex", alignItems: "center",
          gap: 12, cursor: "pointer", textAlign: "left",
          fontFamily: F.sans,
        }}
      >
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.4 }}>
          {q}
        </div>
        {tag && (
          <span style={{
            fontFamily: F.sans, fontSize: 9, color: GOLD, fontWeight: 700,
            letterSpacing: 2, textTransform: "uppercase",
            background: "transparent", padding: "3px 8px",
            border: "1px solid " + SOFT_BORDER, borderRadius: 99,
            whiteSpace: "nowrap",
          }}>{tag}</span>
        )}
        <span style={{ fontSize: 12, color: BURG, opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </button>
      {open && (
        <div style={{
          padding: "14px 20px 16px",
          borderTop: "1px solid " + SOFT_BORDER,
          fontFamily: F.sans, fontSize: 14, lineHeight: 1.6, color: INK,
        }}>
          {renderPlaybookMarkdown(a)}
          {why && (
            <div style={{
              marginTop: 14, paddingTop: 12,
              borderTop: "1px dashed " + SOFT_BORDER,
              fontSize: 13, lineHeight: 1.55, color: INK,
              opacity: 0.85, fontStyle: "italic",
            }}>
              <span style={{
                fontStyle: "normal", fontWeight: 600, fontSize: 10,
                letterSpacing: 2, textTransform: "uppercase",
                color: BURG, opacity: 0.75, marginRight: 6,
              }}>Why it matters ·</span>
              {renderPlaybookMarkdown(why)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Chip filter row.
function PlaybookChipRow({ chips, counts, active, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
      {chips.map((c) => {
        const isActive = c.key === active;
        const count = counts[c.key] ?? 0;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            style={{
              background: isActive ? BURG : W,
              color: isActive ? CREAM : BURG,
              border: "1px solid " + (isActive ? BURG : SOFT_BORDER),
              fontFamily: F.sans, fontSize: 11, fontWeight: 600,
              padding: "6px 12px", borderRadius: 99, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}
          >
            {c.label}
            <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 700 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Helper — filter Q&A list by category + search query.
function filterQA(list, cat, query) {
  let out = cat === "all" ? list : list.filter((x) => x.cat === cat);
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter((x) =>
      (x.q || "").toLowerCase().includes(q) ||
      (x.a || "").toLowerCase().includes(q) ||
      (x.why || "").toLowerCase().includes(q)
    );
  }
  return out;
}

// Pricing reminder banner used at top of Products tab.
function PricingNote() {
  return (
    <div style={{
      background: "#FDF8F0",
      border: "1px solid #E8DCC0",
      borderLeft: "3px solid " + GOLD,
      padding: "12px 16px",
      marginBottom: 22,
      fontSize: 13, lineHeight: 1.55, color: INK,
      borderRadius: 4,
      fontFamily: F.sans,
    }}>
      <strong style={{ color: BURG }}>Pricing reminder:</strong> Customers see their local currency. Always pull the actual amount from the customer's order in Shopify/Gorgias before quoting any number — never quote pricing from internal docs.
    </div>
  );
}

// ─── Products subpanel ───────────────────────────────────────────────

function PlaybookProductsNew({ query }) {
  const [openProduct, setOpenProduct] = useState(null);
  const [chip, setChip] = useState("all");

  // Combined Q&A list (About LUMÉ + Common Product Q&As) for chip filtering.
  const allQA = useMemo(() => [...ABOUT_BRAND_QA, ...COMMON_PRODUCT_QA], []);
  const filtered = useMemo(() => filterQA(allQA, chip, query), [allQA, chip, query]);

  // Counts per chip key (for the chip badges).
  const counts = useMemo(() => {
    const c = { all: allQA.length };
    for (const item of allQA) c[item.cat] = (c[item.cat] || 0) + 1;
    return c;
  }, [allQA]);

  // When searching, hide product cards (Q&A search is the focus).
  const showProducts = !query || !query.trim();

  return (
    <div>
      {/* PricingNote removed — agents pull live pricing from Shopify/Gorgias */}

      {/* Product reference cards */}
      {showProducts && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 8 }}>
          {PRODUCT_CARDS.map((p) => {
            const isOpen = openProduct === p.key;
            return (
              <div key={p.key} style={{
                background: W,
                border: "1px solid " + SOFT_BORDER,
                borderRadius: 8,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.15s",
                gridColumn: isOpen ? "1 / -1" : "auto",
              }} onClick={() => setOpenProduct(isOpen ? null : p.key)}>
                <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, marginBottom: 14 }}>{p.tagline}</div>
                <div style={{ display: "flex", gap: 16, marginBottom: isOpen ? 18 : 0 }}>
                  {p.stats.map((s, i) => (
                    <div key={i} style={{ fontFamily: F.sans, fontSize: 11, color: INK }}>
                      <strong style={{ display: "block", color: BURG, fontSize: 18, fontWeight: 700 }}>{s.value}</strong>
                      <span style={{ opacity: 0.6, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid " + SOFT_BORDER, paddingTop: 16, marginTop: 4 }}>
                    {p.sections.map((sec, si) => (
                      <div key={si} style={{ marginBottom: 14 }}>
                        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{sec.heading}</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 13, lineHeight: 1.6, color: INK }}>
                          {sec.items.map((it, ii) => (
                            <li key={ii} style={{ marginBottom: 4 }}>{renderPlaybookMarkdown(it)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Common Questions section */}
      <PlaybookSectionHeader>Common Questions</PlaybookSectionHeader>
      <PlaybookChipRow chips={PRODUCT_QA_CHIPS} counts={counts} active={chip} onChange={setChip} />
      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No questions match. Try a different search or chip.
        </div>
      ) : (
        filtered.map((qa, i) => (
          <PlaybookQACard key={qa.q + i} q={qa.q} a={qa.a} tag={qa.tag} why={qa.why} />
        ))
      )}
    </div>
  );
}

// ─── Policy subpanel ─────────────────────────────────────────────────

function PlaybookPolicyNew({ query }) {
  const [chip, setChip] = useState("all");
  const filtered = useMemo(() => filterQA(POLICY_QA, chip, query), [chip, query]);
  const counts = useMemo(() => {
    const c = { all: POLICY_QA.length };
    for (const item of POLICY_QA) c[item.cat] = (c[item.cat] || 0) + 1;
    return c;
  }, []);
  const q = (query || "").trim().toLowerCase();
  const filteredShipping = q
    ? SHIPPING_LEAD_TIMES.filter((r) => r.region.toLowerCase().includes(q))
    : SHIPPING_LEAD_TIMES;

  return (
    <div>
      <PlaybookChipRow chips={POLICY_QA_CHIPS} counts={counts} active={chip} onChange={setChip} />
      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No questions match. Try a different search or chip.
        </div>
      ) : (
        filtered.map((qa, i) => (
          <PlaybookQACard key={qa.q + i} q={qa.q} a={qa.a} tag={qa.tag} why={qa.why} />
        ))
      )}

      {/* Shipping windows — moved here from How To */}
      {(!q || filteredShipping.length > 0) && (
        <>
          <PlaybookSectionHeader>Shipping windows</PlaybookSectionHeader>
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
            <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: CREAM, padding: "8px 18px", fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: INK, opacity: 0.6 }}>
              <span>Region</span><span style={{ textAlign: "center" }}>Standard</span><span style={{ textAlign: "right" }}>Express</span>
            </div>
            {filteredShipping.map((r, i) => (
              <div key={r.region} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 13, color: INK }}>
                <span style={{ fontWeight: 600 }}>{r.region}</span>
                <span style={{ textAlign: "center", color: BURG }}>{r.standard}</span>
                <span style={{ textAlign: "right", color: BURG }}>{r.express}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.45, marginTop: 4, marginBottom: 16 }}>
            Business days from dispatch. Express available at checkout. Timelines are estimates — check Aftership for live tracking.
          </div>
        </>
      )}
    </div>
  );
}

// ─── How To subpanel ─────────────────────────────────────────────────

function PlaybookShippingNew({ query }) {
  const q = (query || "").trim().toLowerCase();

  const HOW_TO_GUIDES = [
    {
      name: "Smooth Serum",
      emoji: "✨",
      steps: [
        "Apply 2–3 pumps to palms and rub together",
        "Work through mid-lengths to ends on damp or dry hair",
        "Do not apply to roots (weighs down fine hair)",
        "Style as usual — works with or without heat",
      ],
      tip: "For maximum frizz control, apply on damp hair before blowdrying.",
      when: "Damp or dry · Daily · Heat styling days",
    },
    {
      name: "Repair Serum",
      emoji: "🔧",
      steps: [
        "Start with freshly washed, towel-dried damp hair",
        "Apply 3–4 pumps, focusing on the most damaged sections and ends",
        "Leave in — do not rinse",
        "Style as usual. Use consistently for 6+ weeks for bond repair",
      ],
      tip: "Bond repair is cumulative. If a customer says it's not working at 2 weeks, that's normal — encourage them to continue.",
      when: "Damp hair only · Daily · Best for damaged/colour-treated",
    },
    {
      name: "Scalp Serum",
      emoji: "🌿",
      steps: [
        "Part hair into sections and apply directly to the scalp using the dropper",
        "Massage in with fingertips for 1–2 minutes",
        "Do not rinse out",
        "Use 3× per week — not daily. Over-use can cause irritation",
      ],
      tip: "The tingling is from peppermint oil — normal and expected. It means circulation is increasing. If it burns rather than tingles, stop use immediately and log it.",
      when: "Dry or slightly damp scalp · 3× per week · Do not rinse",
    },
    {
      name: "Glow Serum",
      emoji: "💫",
      steps: [
        "Dispense 1–2 pumps into palm",
        "Apply all over — roots to ends — for full-hair glow",
        "Or apply to ends only as a split-end treatment",
        "Use on dry or damp hair — can be used daily",
      ],
      tip: "The lightest serum in the range. Ideal for fine hair. Can be layered under Smooth or over Repair without weighing hair down.",
      when: "Damp or dry · Daily · All hair types",
    },
  ];

  const COMMON_QUESTIONS = [
    {
      q: "A customer says their Scalp Serum is tingling — is that normal?",
      a: "Yes, and this is the single most important thing to get right. The peppermint oil causes a tingling sensation — that's completely expected and means it's activating.\n\n**Ask: is it tingling or burning?**\n- **Tingling** (mild, goes away) → Reassure and continue. \"That's the peppermint oil getting to work — it's a sign it's activating.\"\n- **Burning / painful / doesn't go away** → Stop use immediately. Log as a Reaction/Concern. Issue a full refund. Escalate to Head of CX.\n\nDo not say \"unfortunately\" or \"I'm sorry it's not working for you\" — you're not apologising for a product doing what it should.",
      why: "This is our #1 query. Getting the tingle vs. burn distinction right prevents unnecessary refunds AND protects the customer if there's a genuine adverse reaction. About 30% of refund requests for Scalp Serum can be saved by educating on tingling.",
      tag: "Scalp Serum",
    },
    {
      q: "Customer opened the serum — can they still get a cash refund?",
      a: "**Opened product = exchange or store credit. Not cash.** That's the standard policy.\n\n**Exceptions that get a full cash refund:**\n- Adverse reaction of any kind → full cash refund, no questions asked\n- Product was clearly faulty (pump broken, leaking) → full refund\n- Within 30 days and customer has barely used it (2–3 pumps) → use judgment, Manager sign-off\n\nIf they push for cash outside these exceptions, escalate to Manager — don't agree to it yourself.",
      why: "The exchange/credit policy protects us from serial returners while being fair to genuine cases. Knowing the exceptions is what separates a good agent from a great one — you're not just enforcing a rule, you're making a judgment call.",
      tag: "Refunds",
    },
    {
      q: "Customer says they're not seeing results — what do I do?",
      a: "**First: ask how long they've been using it.** Results are time-dependent.\n\n- **Under 4 weeks**: Timeline education. Results are still building. Encourage to continue. Check application routine.\n- **4–8 weeks**: Dig deeper. Are they applying correctly? Daily for hair serums? 3×/week for Scalp? Suggest a routine check.\n- **8–12 weeks**: Offer a serum formula review — maybe the formula isn't right for their hair type. Consider a swap.\n- **12+ weeks with no change**: Partial refund or swap, with Manager sign-off.\n\nNever say \"results vary\" and leave it there. Be specific about what to expect and when.",
      why: "Customers who cancel at week 2 haven't given the product a real chance. Timeline education is one of the highest-ROI moves in CX — it retains subscribers and builds trust. Agents who ask 'how long have you been using it?' before offering a refund save significantly more cases.",
      tag: "Results",
    },
    {
      q: "Customer wants to cancel their Hair Edit subscription — what do I do?",
      a: "**Ask why before you offer anything.** This is the most important step.\n\nThen match your save to their reason:\n- **Wrong serums** → \"I can swap those right now in your account — what serums would work better?\"\n- **Too expensive** → Pause offer (1–3 months). If they hesitate: 10% loyalty discount on next 3 boxes.\n- **Accumulating product / not using fast enough** → Skip next month or switch to bi-monthly.\n- **No results yet** → Timeline education (see results Q above).\n- **Personal reason / moving** → Pause offer only. Don't push. Warm send-off.\n\nIf they still want to cancel after one save attempt — process it. No guilt, no second push.",
      why: "Agents who ask why first have significantly higher save rates than those who go straight to offers. The reason changes everything — a price objection and a wrong-formula objection need completely different plays.",
      tag: "Subscription",
    },
    {
      q: "Customer missed the serum swap deadline — can I still swap it?",
      a: "**The cutoff is the 12th of the month. The box ships on the 15th.**\n\nIf they contact you on or before the 12th → process the swap immediately in Skio.\n\nIf they contact you after the 12th:\n- Acknowledge they've missed this month's box\n- Note their preference in Skio for next month's box\n- Confirm it's locked in: \"I've noted your swap and your next box will have [serums] — you'll see it update in your portal.\"\n\n**Do not** promise a mid-cycle swap after the 12th — this creates fulfilment errors.",
      why: "A firm cutoff prevents warehouse chaos. But how you deliver that message matters. \"We've just missed it for this box, but I've sorted it for next month\" is very different from \"sorry, the deadline has passed.\"",
      tag: "Subscription",
    },
    {
      q: "Customer received the wrong serums in their box — what now?",
      a: "1. Apologise sincerely\n2. Pull up their hair profile and confirm what they should have received\n3. Arrange a replacement shipment immediately — **no return required**\n4. Log as Order Issue → Wrong Serum / Wrong Box\n\nDon't wait for them to ship the wrong ones back. Speed is the whole play here.",
      why: "A fast replacement turns a fulfilment mistake into a trust-building moment. Customers who get sorted quickly — especially without being asked to return things — are often more loyal afterwards. The log also helps ops spot patterns.",
      tag: "Order Issue",
    },
  ];

  const filteredGuides = q
    ? HOW_TO_GUIDES.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        g.steps.some((s) => s.toLowerCase().includes(q)) ||
        g.tip.toLowerCase().includes(q)
      )
    : HOW_TO_GUIDES;

  const filteredQuestions = q
    ? COMMON_QUESTIONS.filter((cq) =>
        cq.q.toLowerCase().includes(q) ||
        cq.a.toLowerCase().includes(q) ||
        (cq.why || "").toLowerCase().includes(q)
      )
    : COMMON_QUESTIONS;

  return (
    <div>
      {/* Application guides */}
      {(!q || filteredGuides.length > 0) && (
        <>
          <PlaybookSectionHeader>Application guides</PlaybookSectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 24 }}>
            {filteredGuides.map((g) => (
              <div key={g.name} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 600, color: BURG }}>{g.name}</div>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>{g.when}</div>
                  </div>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.7 }}>
                  {g.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                </ol>
                <div style={{ marginTop: 12, background: CREAM, borderRadius: 6, padding: "8px 12px", fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.8, lineHeight: 1.5 }}>
                  💡 {g.tip}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Common questions — trainer style */}
      {(!q || filteredQuestions.length > 0) && (
        <>
          <PlaybookSectionHeader>Common Questions</PlaybookSectionHeader>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.65, marginBottom: 14, lineHeight: 1.55 }}>
            The questions agents ask most. Read the answer, understand the why, then you won't need to ask your TL.
          </div>
          {filteredQuestions.map((cq, i) => (
            <PlaybookQACard key={cq.q + i} q={cq.q} a={cq.a} tag={cq.tag} why={cq.why} />
          ))}
        </>
      )}
    </div>
  );
}

// ─── Escalation subpanel ─────────────────────────────────────────────

function PlaybookEscalationNew({ query }) {
  const q = (query || "").trim().toLowerCase();

  const SAVE_PLAYS = [
    {
      reason: "Too expensive / budget",
      play: "Offer a pause first (1–3 months) — don't lead with a discount. If they hesitate after the pause offer, then add: 10% loyalty discount off next 3 boxes.",
      script: "\"Let me pause your subscription for a couple of months so there's no pressure — you can reactivate whenever you're ready, and I'll make sure your hair profile is saved.\"",
      saveRate: "~42%",
    },
    {
      reason: "Wrong serums / doesn't suit my hair",
      play: "Swap immediately. Pull up their hair profile in Skio and update it in real time. \"I can change that right now.\" No discount needed — just fix the problem.",
      script: "\"I can swap those out right now — what would work better for your hair? Let me update your profile so your next box is exactly right.\"",
      saveRate: "~61%",
    },
    {
      reason: "Not using fast enough / accumulating product",
      play: "Offer to skip the next dispatch or switch to bi-monthly shipping. Frame it as flexibility, not a downgrade.",
      script: "\"Let's skip next month's box so you can catch up — then we'll pick back up when you're ready. Or I can switch you to bi-monthly so the timing works better.\"",
      saveRate: "~55%",
    },
    {
      reason: "Not seeing results yet",
      play: "Timeline education first. Ask how long they've been using it. Under 6 weeks: normalise, encourage. 6–12 weeks: check application routine and offer a formula review. Don't offer a refund before the conversation.",
      script: "\"Results with serums are cumulative — most customers see the real change around week 6–8. How long have you been using it? Let's make sure the routine is set up for success.\"",
      saveRate: "~38%",
    },
    {
      reason: "Personal reason / moving / life change",
      play: "Pause offer only. Don't push. Wish them well and keep the door open. A warm exit is worth more than a forced save.",
      script: "\"Of course — let me pause it for you so everything's saved when you're ready to come back. No pressure at all.\"",
      saveRate: "~31%",
    },
  ];

  const escalateList = q
    ? ESCALATE_IMMEDIATELY.filter((x) => x.toLowerCase().includes(q))
    : ESCALATE_IMMEDIATELY;

  const decisionRows = q
    ? DECISION_TREE.filter((x) =>
        (x.situation || "").toLowerCase().includes(q) ||
        (x.action || "").toLowerCase().includes(q)
      )
    : DECISION_TREE;

  const filteredSavePlays = q
    ? SAVE_PLAYS.filter((s) =>
        s.reason.toLowerCase().includes(q) ||
        s.play.toLowerCase().includes(q)
      )
    : SAVE_PLAYS;

  return (
    <div>
      {/* Save Plays */}
      {(!q || filteredSavePlays.length > 0) && (
        <>
          <PlaybookSectionHeader>Save Plays</PlaybookSectionHeader>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 14, lineHeight: 1.55 }}>
            Match the play to the reason. Ask why first — then pick from below.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
            {filteredSavePlays.map((s, i) => (
              <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 700, color: INK }}>{s.reason}</div>
                  <span style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: GOLD, textTransform: "uppercase", background: CREAM, padding: "3px 10px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, whiteSpace: "nowrap" }}>Save rate {s.saveRate}</span>
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6, marginBottom: 10 }}>{s.play}</div>
                <div style={{ background: CREAM, borderRadius: 6, padding: "10px 14px", fontFamily: F.sans, fontSize: 12, color: BURG, fontStyle: "italic", lineHeight: 1.55 }}>
                  {s.script}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Escalate Immediately */}
      {(!q || escalateList.length > 0) && (
        <>
          <PlaybookSectionHeader>Escalate Immediately</PlaybookSectionHeader>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 14, lineHeight: 1.55 }}>
            Slack the Head of CX as soon as any of these come in — don't wait for the case to play out.
          </div>
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "14px 20px", marginBottom: 8 }}>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 14, lineHeight: 1.7, color: INK }}>
              {escalateList.map((line, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{line}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Decision reference */}
      {(!q || decisionRows.length > 0) && (
        <>
          <PlaybookSectionHeader>Decision Reference</PlaybookSectionHeader>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 14, lineHeight: 1.55 }}>
            Common situations and the right action — use as a quick reference when you're unsure.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {decisionRows.map((row, i) => (
              <PlaybookQACard
                key={(row.situation || "") + i}
                q={row.situation}
                a={row.action}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Voice subpanel ──────────────────────────────────────────────────

function PlaybookVoiceNew({ query }) {
  const q = (query || "").trim().toLowerCase();
  const filteredPairs = q
    ? VOICE_PAIRS.filter((p) =>
        (p.bad || "").toLowerCase().includes(q) ||
        (p.good || "").toLowerCase().includes(q)
      )
    : VOICE_PAIRS;

  return (
    <div>
      <PlaybookSectionHeader>We Are / We Are Not</PlaybookSectionHeader>
      <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>We Are</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 14, lineHeight: 1.8, color: INK }}>
            {VOICE_RULES.we_are.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>We Are Not</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 14, lineHeight: 1.8, color: INK, opacity: 0.7 }}>
            {VOICE_RULES.we_are_not.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
      </div>

      <PlaybookSectionHeader>Bad → Good Rewrites</PlaybookSectionHeader>
      {filteredPairs.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No rewrites match.
        </div>
      ) : (
        filteredPairs.map((p, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14,
            alignItems: "center", marginBottom: 10,
            background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "14px 18px",
          }}>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, fontStyle: "italic", lineHeight: 1.5 }}>
              &ldquo;{p.bad}&rdquo;
            </div>
            <div style={{ fontFamily: F.serif, fontSize: 18, color: GOLD, fontWeight: 600 }}>→</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5 }}>
              &ldquo;{p.good}&rdquo;
            </div>
          </div>
        ))
      )}

      {!q && (
        <div style={{ background: BURG, borderRadius: 10, padding: "18px 24px", display: "flex", gap: 14, alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 22 }}>✍️</span>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 4 }}>Close every response with</div>
            <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: CREAM }}>With care, [Your name] — LUMÉ HAIR</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Non-Negotiables subpanel ────────────────────────────────────────

function PlaybookNonNegNew({ query }) {
  const q = (query || "").trim().toLowerCase();
  const filtered = q
    ? NON_NEGOTIABLES.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.detail.toLowerCase().includes(q)
      )
    : NON_NEGOTIABLES;

  return (
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 18, lineHeight: 1.55 }}>
        Hard rules. Customer pressure doesn't change them — when in doubt, flag rather than flex.
      </div>
      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No rules match.
        </div>
      ) : (
        filtered.map((n, i) => (
          <div key={n.title + i} style={{
            background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
            padding: "16px 20px", marginBottom: 10,
          }}>
            <div style={{ fontFamily: F.serif, fontSize: 16, color: BURG, fontWeight: 600, marginBottom: 6 }}>
              {n.title}
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>
              {renderPlaybookMarkdown(n.detail)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEAM TAB — Admin / Owner only
// User management UI: list, invite, change role, remove access.
// All actions flow through /api/admin/users/* + /api/admin/invitations/*
// which in turn call Clerk's backend API server-side.
// ═══════════════════════════════════════════════════════════════════════════

// 5.8 — the trust layer: how access, audit, and data handling work.
// Owner-visible, linked from Team.
function SecurityAccessPanel({ onClose }) {
  const ROLE_MODEL = [
    ["Home", "Everyone"], ["Insights · Logs · Playbook · Training", "Agent+ (Training also open to New Starters)"],
    ["Reports", "Lead Agent+"], ["Records · Reports Impact", "Manager+"], ["Team · Security", "Admin / Owner"],
  ];
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "22px 26px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600 }}>Security &amp; access</div>
        <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, width: 28, height: 28, borderRadius: 99, cursor: "pointer", fontFamily: F.sans, fontSize: 13, padding: 0 }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>Role model</div>
          {ROLE_MODEL.map(([area, who]) => (
            <div key={area} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: "1px solid #F3EEE6", fontFamily: F.sans, fontSize: 12.5 }}>
              <span style={{ color: BURG, fontWeight: 600 }}>{area}</span>
              <span style={{ color: INK, opacity: 0.65, textAlign: "right" }}>{who}</span>
            </div>
          ))}
          <div style={{ fontFamily: F.sans, fontSize: 11.5, color: INK, opacity: 0.6, marginTop: 8, lineHeight: 1.5 }}>
            Roles live on the identity provider (Clerk), enforced server-side on every API call. "View as" previews are visual only — permissions never change.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>Audit trail</div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.65 }}>
            Every log records who created it and when. Agents can self-edit for 60 minutes; after that, records lock and only Manager+ can change them — each edit stamps a new version visible in the record drawer. Nothing is hard-deleted from the audit view.
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>Data handling</div>
          <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.65 }}>
            Customer data stays inside the Hub and the systems it mirrors (Shopify, Gorgias, Skio, Loop). Exports (CSV, win-back lists) are on-demand and logged. AI answers are grounded in the Playbook — no customer data is used for model training.
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamTab({ role }) {
  const [showSecurity, setShowSecurity] = useState(false);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyInviteId, setBusyInviteId] = useState(null);
  const isOwner = role === "Owner";

  async function loadTeam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setUsers(json.users || []);
      setPending(json.pendingInvites || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadTeam(); }, []);

  async function changeRole(userId, newRole) {
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      // Optimistic local update
      setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, role: newRole, effectiveRole: u.email?.toLowerCase() === "cherie.jones@prenetics.com" ? "Owner" : newRole } : u)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeUser(userId, email) {
    if (!confirm(`Remove ${email}? They will lose access immediately and will need a new invitation to come back.`)) return;
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setUsers((cur) => cur.filter((u) => u.id !== userId));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function revokeInvite(inviteId, email) {
    if (!confirm(`Revoke pending invite for ${email}? The magic link in their email will stop working.`)) return;
    setBusyInviteId(inviteId);
    try {
      const res = await fetch(`/api/admin/invitations/${inviteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setPending((cur) => cur.filter((i) => i.id !== inviteId));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyInviteId(null);
    }
  }

  // Warn if any non-Owner user has no explicit role set. Once the team
  // flips TESTING_OPEN_ACCESS off in lib/auth.js, those users will drop
  // to "New Starter" and lose access.
  const unassignedCount = users.filter((u) => !u.role && u.effectiveRole !== "Owner").length;

  // Permission helpers (UI gating — backend re-enforces all of these)
  function canEditRow(u) {
    if (u.effectiveRole === "Owner") return false; // Owner is locked
    if (!isOwner && u.role === "Admin") return false; // Admins can't touch other Admins
    return true;
  }
  function rolesAvailableFor(u) {
    return TEAM_ROLES.filter((r) => {
      if (r === "Owner") return false;
      if (r === "Admin" && !isOwner) return false;
      return true;
    });
  }
  function fmtLastSeen(iso) {
    if (!iso) return "never";
    const t = typeof iso === "number" ? iso : new Date(iso).getTime();
    if (!Number.isFinite(t)) return "—";
    const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const cardS = { background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 12, padding: "16px 20px", marginBottom: 10 };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 96px" }}>
        <div style={eyebrowS}>LUMÉ HAIR — Team Management</div>
        <div style={{ fontFamily: F.serif, fontSize: "clamp(32px, 7vw, 48px)", color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 14, letterSpacing: -1 }}>
          Team
        </div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6, marginBottom: 22, maxWidth: 700 }}>
          Invite people. Assign roles. Manage access. {isOwner ? "You're the Owner — you can do anything here." : role === "Admin" ? "You're an Admin — you can manage everyone except other Admins and the Owner." : `You're viewing as ${/^[AEIOU]/.test(role || "") ? "an" : "a"} ${role} — team management is read-only from this role.`}
          {isOwner && (
            <>
              {" "}
              <button onClick={() => setShowSecurity((v) => !v)} style={{ background: "transparent", border: "none", padding: 0, fontFamily: F.sans, fontSize: "inherit", color: BURG, textDecoration: "underline", cursor: "pointer" }}>
                Security &amp; access
              </button>
            </>
          )}
        </div>

        {showSecurity && <SecurityAccessPanel onClose={() => setShowSecurity(false)} />}

        {/* Safety banner — unassigned roles */}
        {unassignedCount > 0 && (
          <div style={{ background: "#FFF4DC", border: "1px solid " + GOLD, borderLeft: "3px solid " + GOLD, borderRadius: 8, padding: "14px 18px", marginBottom: 20, fontFamily: F.sans, fontSize: 13, lineHeight: 1.6, color: INK }}>
            <strong style={{ color: BURG }}>⚠ {unassignedCount} {unassignedCount === 1 ? "user has" : "users have"} no role assigned.</strong>{" "}
            They currently have access via TESTING_OPEN_ACCESS in <code>lib/auth.js</code>. Once that flag is flipped off, they'll lose access. Assign their roles below first.
          </div>
        )}

        {/* Top bar — invite + refresh */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            {loading ? "" : `${users.length} user${users.length === 1 ? "" : "s"}`}
            {pending.length > 0 && ` · ${pending.length} pending invite${pending.length === 1 ? "" : "s"}`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadTeam} disabled={loading} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "8px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: loading ? "wait" : "pointer", borderRadius: 99, opacity: loading ? 0.5 : 1 }}>
              Refresh
            </button>
            <button onClick={() => setShowInvite(true)} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
              + Invite user
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, marginBottom: 16, fontFamily: F.sans, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* USERS LIST */}
        {!loading && users.length === 0 && !error && (
          <div style={{ ...cardS, fontFamily: F.serif, fontStyle: "italic", textAlign: "center", color: INK, opacity: 0.6, padding: "40px 20px" }}>
            No team members yet. Click "Invite user" to get started.
          </div>
        )}

        {users.map((u) => {
          const locked = !canEditRow(u);
          const rowBusy = busyUserId === u.id;
          const isYou = u.email && (typeof window !== "undefined" && u.email === window.__VIEWER_EMAIL); // best-effort flag; backend enforces
          return (
            <div key={u.id} style={{ ...cardS, opacity: rowBusy ? 0.5 : 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 14, alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || "(no name set)"}
                    {u.effectiveRole === "Owner" && <span style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, marginLeft: 8, padding: "2px 8px", border: "1px solid " + GOLD, borderRadius: 99 }}>OWNER</span>}
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6 }}>{u.email || "(no email)"}</div>
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, letterSpacing: 0.5 }}>
                  Last seen: {fmtLastSeen(u.lastSignInAt)}
                </div>
                <div>
                  {u.effectiveRole === "Owner" ? (
                    <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: BURG, padding: "6px 14px" }}>
                      Owner
                    </span>
                  ) : (
                    <div style={{ width: 150 }}><Combobox
                      value={u.role || ""}
                      onChange={(v) => changeRole(u.id, v)}
                      disabled={locked || rowBusy}
                      options={TEAM_ROLES}
                      placeholder="No role"
                      style={{ padding: "6px 12px", fontSize: 12, background: locked ? CREAM : W }}
                    /></div>
                  )}
                </div>
                <div>
                  {u.effectiveRole === "Owner" ? null : (
                    <button
                      onClick={() => removeUser(u.id, u.email)}
                      disabled={locked || rowBusy}
                      title={locked ? "Only Owner can remove this user" : "Remove access"}
                      style={{
                        background: "transparent",
                        border: "1px solid " + SOFT_BORDER,
                        color: locked ? INK : RED,
                        opacity: locked ? 0.3 : 0.8,
                        fontFamily: F.sans,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 99,
                        cursor: locked ? "not-allowed" : "pointer",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div></div>
              </div>
            </div>
          );
        })}

        {/* PENDING INVITES */}
        {pending.length > 0 && (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 36, marginBottom: 12 }}>
              Pending invites
            </div>
            {pending.map((inv) => (
              <div key={inv.id} style={{ ...cardS, background: "#FBF7F2", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: busyInviteId === inv.id ? 0.5 : 1 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.6, marginTop: 2 }}>
                    Invited as <strong style={{ color: BURG }}>{inv.role || "(no role set)"}</strong>
                    {inv.createdAt && " · " + fmtLastSeen(inv.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id, inv.email)}
                  disabled={busyInviteId === inv.id}
                  style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: RED, opacity: 0.85, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 99, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {showInvite && (
        <InviteUserModal
          viewerIsOwner={isOwner}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); loadTeam(); }}
        />
      )}
    </div>
  );
}

function InviteUserModal({ viewerIsOwner, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const availableRoles = TEAM_ROLES.filter((r) => {
    if (r === "Owner") return false;
    if (r === "Admin" && !viewerIsOwner) return false;
    return true;
  });

  async function submit() {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onInvited();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: W, borderRadius: 12, padding: "28px 32px", width: "100%", maxWidth: 460, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ fontFamily: F.serif, fontSize: 24, color: BURG, fontWeight: 600, marginBottom: 6 }}>Invite a user</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.6, marginBottom: 22 }}>
          They'll get a magic-link email to sign in and join the Hub with the role you choose.
        </div>

        <label style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="newteammate@example.com"
          autoFocus
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
        />

        <label style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Role</label>
        <div style={{ marginBottom: 20 }}>
          <Combobox value={role} onChange={setRole} options={availableRoles} style={{ fontSize: 14 }} />
        </div>

        {error && (
          <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 10, borderRadius: 6, marginBottom: 14, fontFamily: F.sans, fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={submitting} style={{ background: "transparent", color: INK, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99 }}>
            Cancel
          </button>
          <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Sending..." : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY PLAYBOOK SUBCOMPONENTS — orphaned, no longer referenced
// Kept in the file so Macros (a real DB-backed feature) can be revived
// later without re-implementing. Safe to remove if/when we commit to
// fully retiring Macros.
// ═══════════════════════════════════════════════════════════════════════════

function PlaybookMacros({ role }) {
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const [seedStatus, setSeedStatus] = useState(null);

  const isManagerPlus = role && ["Manager", "Admin", "Owner"].includes(role);

  async function loadMacros() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/kb/macros?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setMacros(json.macros || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMacros(); }, [category]);

  const onSearchSubmit = (e) => { e.preventDefault(); loadMacros(); };

  async function runSeed() {
    if (!confirm("Seed all macros from the markdown source? This will upsert ~209 records.")) return;
    setSeedStatus("running");
    try {
      const res = await fetch(`/api/admin/kb/seed`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSeedStatus(`✓ ${json.upserted} macros seeded`);
      loadMacros();
    } catch (e) {
      setSeedStatus(`✗ ${e.message}`);
    }
  }

  function copyBody(macro) {
    navigator.clipboard.writeText(macro.body);
    setExpanded((p) => ({ ...p, [macro.id]: { ...(p[macro.id] || {}), copied: true } }));
    setTimeout(() => {
      setExpanded((p) => ({ ...p, [macro.id]: { ...(p[macro.id] || {}), copied: false } }));
    }, 1500);
  }

  function toggleExpanded(id) {
    setExpanded((p) => ({ ...p, [id]: { ...(p[id] || {}), open: !(p[id]?.open) } }));
  }

  return (
    <div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, maxWidth: 640, lineHeight: 1.4, marginBottom: 28 }}>
          Search by question, tag or content. Click any macro to expand and copy.
        </div>

        {/* Search + admin controls */}
        <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search macros…"
            style={{ flex: 1, minWidth: 240, padding: "12px 18px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none" }}
          />
          <button type="submit" style={{ background: BURG, border: "1px solid " + BURG, color: CREAM, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 22px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            Search
          </button>
          {isManagerPlus && (
            <button type="button" onClick={runSeed} disabled={seedStatus === "running"} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "12px 18px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
              {seedStatus === "running" ? "Re-seeding…" : "Re-seed from source"}
            </button>
          )}
        </form>
        {seedStatus && seedStatus !== "running" && (
          <div style={{ fontFamily: F.sans, fontSize: 12, color: seedStatus.startsWith("✓") ? "#3F8A3F" : RED, marginBottom: 16 }}>{seedStatus}</div>
        )}

        {/* Category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
          {KB_CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button key={c} onClick={() => setCategory(c)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Error / empty */}
        {error && (
          <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 12, fontFamily: F.sans, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {!loading && !error && macros.length === 0 && (
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>
            No macros match{query ? ` "${query}"` : category !== "All" ? ` in ${category}` : ""}. Try a different search or category.
          </div>
        )}

        {/* Macro list */}
        {!loading && !error && macros.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {macros.map((m) => {
              const ex = expanded[m.id] || {};
              const open = !!ex.open;
              return (
                <div key={m.id} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, overflow: "hidden" }}>
                  <button onClick={() => toggleExpanded(m.id)} style={{ width: "100%", textAlign: "left", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.sans, fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", border: "1px solid " + GOLD, padding: "3px 8px", borderRadius: 99 }}>{m.category}</span>
                        {m.escalationRule && (
                          <span style={{ fontFamily: F.sans, fontSize: 9, color: RED, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", border: "1px solid " + RED, padding: "3px 8px", borderRadius: 99 }}>
                            Escalate · {m.escalationRule.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: F.serif, fontSize: 17, color: BURG, fontWeight: 600, lineHeight: 1.3 }}>{m.question}</div>
                      <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, marginTop: 4, letterSpacing: 0.5 }}>LUMÉ HAIR: {m.slug}</div>
                    </div>
                    <span style={{ fontFamily: F.sans, fontSize: 18, color: BURG, opacity: 0.5, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                  </button>
                  {open && (
                    <div style={{ padding: "0 24px 24px", borderTop: "1px solid " + SOFT_BORDER }}>
                      {m.notes && (
                        <div style={{ marginTop: 16, padding: "10px 14px", background: BLUSH, borderRadius: 8, fontFamily: F.sans, fontSize: 12, color: BURG, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                          {m.notes}
                        </div>
                      )}
                      <pre style={{ margin: "16px 0 0", padding: "20px 22px", background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 10, fontFamily: F.sans, fontSize: 14, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{m.body}</pre>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button onClick={() => copyBody(m)} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
                          {ex.copied ? "Copied ✓" : "Copy macro"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && !error && macros.length > 0 && (
          <div style={{ marginTop: 32, fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, letterSpacing: 0.5 }}>
            {macros.length} macro{macros.length === 1 ? "" : "s"}{category !== "All" ? ` in ${category}` : ""}{query ? ` matching "${query}"` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Playbook sub-views ported from former Handbook tab ──

function PlaybookRules() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        Hard rules — non-negotiables across every customer interaction.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 24 }}>
        {NON_NEGOTIABLES.map((r, i) => {
          const accent = r.severity === "high" ? BURG : GOLD;
          return (
            <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + accent, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 9, color: accent, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Rule {i + 1}</div>
              <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, marginBottom: 8 }}>{r.title}</div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.75, lineHeight: 1.6 }}>{r.detail}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: BLUSH, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "18px 24px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ fontSize: 22 }}>✍️</div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: BURG, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 4 }}>Close every response with</div>
          <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG }}>Warmly, Team LUMÉ</div>
        </div>
      </div>
    </div>
  );
}

function PlaybookVoice() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        How the team actually talks to customers — left column out, right column in.
      </div>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, overflow: "hidden" }}>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: SOFT_BORDER, gap: 1 }}>
          <div style={{ background: BLUSH, padding: "14px 22px", fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Don't say</div>
          <div style={{ background: PEACH, padding: "14px 22px", fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Say instead</div>
          {VOICE_PAIRS.flatMap((p, i) => [
            <div key={`b-${i}`} style={{ background: W, padding: "18px 22px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.7, lineHeight: 1.5 }}>"{p.bad}"</div>,
            <div key={`g-${i}`} style={{ background: W, padding: "18px 22px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: BURG, lineHeight: 1.5 }}>"{p.good}"</div>,
          ])}
        </div>
      </div>
    </div>
  );
}

function PlaybookProducts() {
  const [compareOpen, setCompareOpen] = useState(false);
  const [showDisc, setShowDisc] = useState(false);
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        Quick product reference — current SKUs and pricing.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {PRODUCTS.map((p, i) => (
          <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{p.tag}</div>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 16, lineHeight: 1.2 }}>{p.name}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {p.specs.map((s, j) => (
                <div key={j} style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: INK, opacity: 0.55, minWidth: 96, textTransform: "uppercase", letterSpacing: 0.5 }}>{s[0]}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, lineHeight: 1.5, flex: 1 }}>{s[1]}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid " + SOFT_BORDER, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {p.pricing.map((pp, k) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontSize: 12, color: INK }}>
                  <span style={{ opacity: 0.7 }}>{pp[0]}</span>
                  <span style={{ color: BURG, fontWeight: 700 }}>{pp[1]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => setCompareOpen(o => !o)}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "transparent", border: "1px solid " + SOFT_BORDER, borderRadius: 99, padding: "10px 20px", fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" }}
        >
          <span>{compareOpen ? "Hide" : "Compare"} side-by-side</span>
          <span style={{ fontSize: 14 }}>{compareOpen ? "▲" : "▼"}</span>
        </button>
        {compareOpen && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, cursor: "pointer" }}>
                <input type="checkbox" checked={showDisc} onChange={(e) => setShowDisc(e.target.checked)} />
                Show discontinued
              </label>
            </div>
            <CompareMatrix showDiscontinued={showDisc} />
          </div>
        )}
      </div>
    </div>
  );
}

function PlaybookShipping() {
  const [query, setQuery] = useState("");
  const filtered = SHIPPING_ROWS.filter((r) =>
    !query.trim() || r.region.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 8 }}>
        Average lead times in calendar days, from internal CS data. Set expectations early.
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.5, marginBottom: 24, letterSpacing: 0.3 }}>
        Source: CS Master SOP — Shipping Times External
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search country…"
        style={{ width: "100%", padding: "12px 18px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
      />
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, overflow: "hidden" }}>
        {filtered.map((r, i) => (
          <div key={r.region} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) minmax(90px, 120px) 1fr", gap: 16, padding: "14px 22px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
            <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>{r.region}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, fontWeight: 500 }}>{r.sla}</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.65, fontStyle: "italic" }}>{r.note || ""}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "20px 22px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5 }}>
            No country matches "{query}".
          </div>
        )}
      </div>
      <div style={{ marginTop: 16, fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, letterSpacing: 0.5 }}>
        {filtered.length} {filtered.length === 1 ? "region" : "regions"}{query ? ` matching "${query}"` : ""}
      </div>
    </div>
  );
}

function PlaybookEscalation() {
  const tierColor = (sev) => sev === "high" ? RED : sev === "med" ? GOLD : "#3F8A3F";
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        Three tiers. Know which one a ticket falls into before you draft.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ESCALATION.map((e, i) => {
          const c = tierColor(e.severity);
          return (
            <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + c, borderRadius: 14, padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: c, letterSpacing: 3, textTransform: "uppercase", border: "1px solid " + c, padding: "4px 12px", borderRadius: 99 }}>{e.tier}</span>
                <span style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600 }}>{e.label}</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: INK, opacity: 0.5, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 8 }}>Triggers</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.8, lineHeight: 1.7 }}>
                  {e.triggers.map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: INK, opacity: 0.5, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 8 }}>Action</div>
                <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>{e.action}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrightTile({ label, value, hint, accent }) {
  return (
    <div style={{
      background: accent ? BLUSH : W,
      border: "1px solid " + (accent ? "#F0D5D0" : SOFT_BORDER),
      borderRadius: 14,
      padding: "20px 22px",
      minHeight: 96,
    }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 700, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 6 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── QUIZ TAB ─────────────────────────────────────────────────────────────────
function QuizTab({ selMod, setSelMod, qIdx, chosen, answers, sessionScores, completed, startMod, pickAnswer, nextQ, finishMod }) {
  if (selMod === null) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20, textAlign: "center" }}>All Modules</div>
        {MODULES.map((mod, idx) => {
          const score = sessionScores[mod.id];
          const done  = completed.includes(mod.id);
          const pct   = score !== undefined ? Math.round((score / mod.questions.length) * 100) : null;
          return (
            <div key={mod.id} onClick={() => startMod(idx)} style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{mod.tag}</div>
                <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG }}>{mod.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  {mod.critical && (
                    <span style={{ background: RED, color: W, fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: 1 }}>Critical</span>
                  )}
                  {done && pct !== null && (
                    <span style={{ fontFamily: F.sans, fontSize: 11, color: pct >= 80 ? "#2a7a2a" : RED, fontWeight: 600 }}>{score}/{mod.questions.length} ({pct}%)</span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 20, color: done ? "#2a7a2a" : "#ccc", fontWeight: 700 }}>{done ? "✓" : "›"}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const mod   = MODULES[selMod];
  const q     = mod.questions[qIdx];
  const total = mod.questions.length;
  const pct   = Math.round(((qIdx) / total) * 100);
  const isLast = qIdx === total - 1;
  const correctSoFar = answers.filter(a => a.chosen === a.correct).length;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 40 }}>
      {/* Quiz header */}
      <div style={{ background: W, padding: "16px 20px", borderBottom: "1px solid #e0d9d0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSelMod(null)} style={{ background: "transparent", border: "none", color: RED, fontFamily: F.sans, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 0 }}>{"←"}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: "#999" }}>{mod.tag}</div>
          <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>{mod.title}</div>
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: GOLD }}>{correctSoFar}/{qIdx}</div>
      </div>

      {mod.critical && (
        <div style={{ background: RED, padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: W }}>!</span>
          <span style={{ fontFamily: F.sans, fontSize: 12, color: W, fontWeight: 600 }}>CRITICAL MODULE - These rules have zero tolerance for errors</span>
        </div>
      )}

      <div style={{ background: "#e0d9d0", height: 4 }}>
        <div style={{ background: RED, width: pct + "%", height: "100%", transition: "width 0.3s" }} />
      </div>

      <div style={{ padding: "24px 20px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginBottom: 12 }}>{"Question " + (qIdx + 1) + " of " + total}</div>
        <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 600, color: BURG, lineHeight: 1.5, marginBottom: 24 }}>{q.q}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = W, border = "1px solid #ddd", color = BURG;
            if (chosen !== null) {
              if (i === q.correct)   { bg = "#e8f5e8"; border = "2px solid #2a7a2a"; color = "#1a5a1a"; }
              else if (i === chosen) { bg = "#fde8e8"; border = "2px solid " + RED;  color = RED; }
            }
            return (
              <button key={i} onClick={() => pickAnswer(i)} style={{ background: bg, border, color, fontFamily: F.sans, fontSize: 14, padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: chosen !== null ? "default" : "pointer", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i) + "."}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <div style={{ background: chosen === q.correct ? "#e8f5e8" : "#fff8e8", border: "1px solid " + (chosen === q.correct ? "#2a7a2a" : GOLD), borderRadius: 8, padding: 16, marginTop: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: chosen === q.correct ? "#2a7a2a" : GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {chosen === q.correct ? "Correct!" : "Not quite"}
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#444", lineHeight: 1.6 }}>{q.exp}</div>
            <button onClick={nextQ} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 14 }}>
              {isLast ? "Finish Module" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ASK LUMÉ TAB ─────────────────────────────────────────────────────────────

// Minimal markdown renderer for the Ask LUMÉ chat. Handles **bold**,
// *italic*, `code`, numbered lists (1. text), and bullet lists (- text).
// Zero dependencies — purpose-built for the bot's typical output shape.
function renderChatMarkdown(text) {
  if (!text) return null;
  const lines = String(text).split("\n");
  const blocks = [];
  let listBuf = null; // { type: 'ol' | 'ul', items: [string] }

  const flushList = () => {
    if (listBuf) blocks.push(listBuf);
    listBuf = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const heading = line.match(/^\s*#{1,4}\s+(.+)$/);
    if (heading) { flushList(); blocks.push({ type: "h", text: heading[1] }); continue; }
    const num = line.match(/^\s*(\d+)\.\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);

    if (num) {
      if (!listBuf || listBuf.type !== "ol") { flushList(); listBuf = { type: "ol", items: [] }; }
      listBuf.items.push(num[2]);
      continue;
    }
    if (bullet) {
      if (!listBuf || listBuf.type !== "ul") { flushList(); listBuf = { type: "ul", items: [] }; }
      listBuf.items.push(bullet[1]);
      continue;
    }

    // Non-list line — flush any list, then push paragraph (or blank line spacer)
    flushList();
    if (line.trim() === "") blocks.push({ type: "br" });
    else blocks.push({ type: "p", text: line });
  }
  flushList();

  // Inline formatting — bold / italic / code. Order: bold before italic so
  // "**foo**" doesn't get eaten as two italics.
  const renderInline = (s) => {
    const parts = [];
    const re = /(\*\*([^*\n]+)\*\*)|(\*([^*\n]+)\*)|(`([^`\n]+)`)/g;
    let i = 0, m, key = 0;
    while ((m = re.exec(s)) !== null) {
      if (m.index > i) parts.push(s.slice(i, m.index));
      if (m[1]) parts.push(<strong key={`b${key++}`} style={{ fontWeight: 700, color: BURG }}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={`i${key++}`}>{m[4]}</em>);
      else if (m[5]) parts.push(
        <code key={`c${key++}`} style={{ background: "#f4eee5", padding: "1px 6px", borderRadius: 4, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.92em" }}>{m[6]}</code>
      );
      i = re.lastIndex;
    }
    if (i < s.length) parts.push(s.slice(i));
    return parts;
  };

  return blocks.map((b, idx) => {
    if (b.type === "h") return <div key={idx} style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: GOLD, margin: "10px 0 4px" }}>{b.text}</div>;
    if (b.type === "br") return <div key={idx} style={{ height: 6 }} />;
    if (b.type === "ol") return (
      <ol key={idx} style={{ margin: "4px 0 8px", paddingLeft: 22, lineHeight: 1.55 }}>
        {b.items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{renderInline(it)}</li>)}
      </ol>
    );
    if (b.type === "ul") return (
      <ul key={idx} style={{ margin: "4px 0 8px", paddingLeft: 22, lineHeight: 1.55 }}>
        {b.items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{renderInline(it)}</li>)}
      </ul>
    );
    return <div key={idx} style={{ marginBottom: 6 }}>{renderInline(b.text)}</div>;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATES TAB — May 2026
// CS team's reference for handling affiliate program emails. Static playbook
// sourced from lib/affiliates-data.js (autogenerated from Kendra's macros
// .xlsx). Sub-tabs: Triage (decision tree + status panel), Macros (full
// reply library, searchable, copy-to-clipboard), Program (program overview),
// Links (knowledge base).
//
// Visible to Agent and above (gated in the TABS filter, around line 2039).
// ═══════════════════════════════════════════════════════════════════════════

// "Stats" sub-tab is Manager+ only — filtered into AFFILIATES_SUBTABS
// at render time based on role. Agents never see the chip.
const AFFILIATES_SUBTABS_BASE = ["Start Here", "Macros", "Program", "Links"];

const AFFILIATES_SUBTITLE = {
  // Start Here intentionally has no subtitle — the panel below explains
  // itself (paste box + inline search) and Cherie wanted the top trim.
  "Start Here": "",
  Macros: "Pre-written replies. Copy, personalise [Name] and [bracketed] placeholders, then send.",
  Program: "How the program works. Read once so you know what we can and can't commit to.",
  Links: "Every URL you might need. Internal first, then affiliate-facing.",
  Stats: "Which macros are getting copied most. The 'Not in Gorgias yet' list is your priority for what to add to Gorgias next.",
};

// Small persistent status panel rendered at the top of every Affiliates
// sub-tab. Kept short — Cherie's call: "where to look for what" is the
// most useful baseline orientation.
function AffiliatesStatusPanel() {
  const Row = ({ label, dest }) => (
    <div style={{ display: "flex", gap: 10, padding: "4px 0", fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5 }}>
      <span style={{ flex: 1, opacity: 0.8 }}>{label}</span>
      <span style={{ color: BURG, fontWeight: 700 }}>→ {dest}</span>
    </div>
  );
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
        Before any affiliate email — where to look for what
      </div>
      <Row label="Affiliate account, balance, link, code" dest={<>Social Snowball admin <span style={{ opacity: 0.55, fontWeight: 500 }}>(Tune for pre-May)</span></>} />
      <Row label="Activation, Discord posts, Strava" dest="Discord" />
      <Row label="Orders, sales history" dest="Shopify" />
    </div>
  );
}

// Copy-to-clipboard button. Reusable for any block of text. Shows brief
// "Copied" affirmation on success.
//
// When `macroName` is provided, also fires a fire-and-forget POST to
// /api/affiliates/copy so Cherie can track which macros are getting
// copied most (and therefore which "not in Gorgias yet" macros to add
// to Gorgias next). The fetch is intentionally NOT awaited — never
// block the user's clipboard interaction on a logging round-trip.
function CopyButton({ text, label = "Copy macro", macroName, copyType, inGorgias }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      if (macroName) {
        // Fire-and-forget — silent on failure
        fetch("/api/affiliates/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            macroName,
            copyType: copyType || "unknown",
            inGorgias: !!inGorgias,
          }),
        }).catch(() => {});
      }
    } catch {
      // Older browsers / non-secure context — silently no-op rather than crash.
    }
  };
  return (
    <button
      onClick={doCopy}
      style={{
        background: copied ? GOLD : BURG,
        color: CREAM,
        border: "none",
        fontFamily: F.sans, fontSize: 10, fontWeight: 700,
        padding: "6px 12px", letterSpacing: 1.5, textTransform: "uppercase",
        borderRadius: 99, cursor: "pointer", transition: "background 0.15s",
        whiteSpace: "nowrap",
      }}
    >{copied ? "Copied ✓" : label}</button>
  );
}

function AffiliatesTab({ role }) {
  // Manager+ required (Cherie May 22 — bumped from Lead Agent+ while the
  // workstream is being re-scoped with a dedicated owner). Mirrors the
  // tab-visibility gate in App() so hash-based deep links don't sneak
  // Lead Agents or below in.
  const canView = role && ["Manager", "Admin", "Owner"].includes(role);
  const [sub, setSub] = useState("Start Here");
  const [query, setQuery] = useState("");
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  // Stats sub-tab visible to Manager and above — agents don't see the
  // chip at all, so the chrome stays clean for the day-to-day audience.
  // (Inline role check rather than importing roleAtLeast — matches the
  // pattern used by the other tab-gating in this file.)
  const canSeeStats = role && ["Manager", "Admin", "Owner"].includes(role);
  const subtabs = canSeeStats ? [...AFFILIATES_SUBTABS_BASE, "Stats"] : AFFILIATES_SUBTABS_BASE;

  if (!canView) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 600, marginBottom: 14 }}>Affiliates</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6 }}>
            Affiliates is visible to Manager and above while the workstream is being re-scoped. Ask your manager if you need a question routed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ HAIR — Affiliates Playbook · CS team handover</div>
        <div style={{ fontFamily: F.serif, fontSize: 48, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 8, letterSpacing: -1 }}>
          {sub}
        </div>
        {AFFILIATES_SUBTITLE[sub] && (
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 18, lineHeight: 1.5 }}>
            {AFFILIATES_SUBTITLE[sub]}
          </div>
        )}

        {/* Search bar — scoped to the active panel. Hidden on Start Here
            because that sub-tab has its own inline search field below
            the AI helper, so we'd otherwise stack two near-identical
            inputs at the top. */}
        {sub !== "Start Here" && (
        <div style={{ position: "relative", marginBottom: 22 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${sub.toLowerCase()}…`}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              fontFamily: F.sans, fontSize: 14,
              background: W,
              border: "1px solid " + SOFT_BORDER,
              borderRadius: 8,
              color: INK,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
          />
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>⌕</div>
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", fontSize: 18, color: INK, opacity: 0.4, cursor: "pointer", padding: 4 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>
        )}

        {/* Subtab chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {subtabs.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => { setSub(s); setQuery(""); }} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px 96px" }}>
        <AffiliatesStatusPanel />
        {sub === "Start Here" && <AffiliatesStartHere query={query} setQuery={setQuery} />}
        {sub === "Macros"     && <AffiliatesMacros    query={query} />}
        {sub === "Program"    && <AffiliatesProgram   query={query} />}
        {sub === "Links"      && <AffiliatesLinks     query={query} />}
        {sub === "Stats" && canSeeStats && <AffiliatesStats />}
      </div>
    </div>
  );
}

// ─── Start Here sub-tab ──────────────────────────────────────────────
// Search-first surface. Empty state: chip row + friendly hint. Search
// state: merges matching decision-tree rows ("what kind of email is
// this?") + matching macros ("ready replies"). Guiding principles live
// in a collapsed accordion at the bottom — available, not in the way.
//
// Chips set the parent's query state (passed via setQuery prop) so they
// drive the same search the header search bar does. The Start Here
// component is the only sub-tab that gets setQuery — the others are
// browse-only and don't need to mutate the query.

// Common-trigger chips. Labels are friendly; queries are the keyword
// that actually matches Kendra's content (verified against decisions
// + macros on 2026-05-15).
const AFFILIATES_COMMON_TRIGGERS = [
  { label: "payout",              query: "payout" },
  { label: "where's my link",     query: "link" },
  { label: "free product",        query: "free product" },
  { label: "TUNE / migration",    query: "TUNE" },
  { label: "login issue",         query: "login" },
  { label: "partnership",         query: "partnership" },
  { label: "reward / sales",      query: "reward" },
];

function AffiliatesStartHere({ query, setQuery }) {
  const decisions = AFFILIATES_DATA.decisions ?? [];
  const principles = AFFILIATES_DATA.principles ?? [];
  const allMacros = (AFFILIATES_DATA.macros ?? []).flatMap((c) =>
    c.items.map((m) => ({ ...m, category: c.category }))
  );

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const matchingDecisions = hasQuery
    ? decisions.filter((d) =>
        (d.trigger + " " + d.tag + " " + d.approach + " " + d.macroSheet).toLowerCase().includes(q)
      )
    : [];

  const matchingMacros = hasQuery
    ? allMacros.filter((m) =>
        (m.trigger + " " + m.tag + " " + m.response).toLowerCase().includes(q)
      )
    : [];

  const totalMatches = matchingDecisions.length + matchingMacros.length;

  const [principlesOpen, setPrinciplesOpen] = useState(false);

  // Per Cherie (2026-05-15) — Start Here renders BOTH the AI helper
  // (primary, top) AND the keyword search (secondary, below). No mode
  // toggle. Agent's first instinct is to paste; if they prefer to
  // search by keyword, it's right there below the divider.

  // Section divider for visual separation between the AI helper above
  // and the keyword-search below.
  const Divider = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 18px" }}>
      <div style={{ flex: 1, height: 1, background: SOFT_BORDER }} />
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55 }}>
        or search a keyword below
      </div>
      <div style={{ flex: 1, height: 1, background: SOFT_BORDER }} />
    </div>
  );

  return (
    <div>
      {/* ── AI HELPER (top, primary) ─────────────────────────── */}
      <AffiliatesAskPlaybook />

      <Divider />

      {/* ── KEYWORD SEARCH (below, secondary) ─────────────────── */}

      {/* Inline search field — wired to the same `query` state as
          the parent header search bar so typing here filters the
          chips and results below. */}
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Search by keyword
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. payout, login, free product…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 14px 10px 38px",
              fontFamily: F.sans, fontSize: 14,
              background: CREAM,
              border: "1px solid " + SOFT_BORDER,
              borderRadius: 8, color: INK, outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
          />
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>⌕</div>
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", fontSize: 18, color: INK, opacity: 0.4, cursor: "pointer", padding: 4 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>
      </div>

      {/* Common-trigger chips — primary affordance for cold users */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Common triggers — tap any
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AFFILIATES_COMMON_TRIGGERS.map((t) => {
            const active = q === t.query.toLowerCase();
            return (
              <button
                key={t.label}
                onClick={() => setQuery(active ? "" : t.query)}
                style={{
                  background: active ? BURG : W,
                  color: active ? CREAM : BURG,
                  border: "1px solid " + (active ? BURG : SOFT_BORDER),
                  fontFamily: F.sans, fontSize: 12, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 99, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{t.label}</button>
            );
          })}
        </div>
      </div>

      {/* Empty state — what to do when nothing is typed */}
      {!hasQuery && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "26px 28px", textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, marginBottom: 6 }}>
            Got an affiliate email?
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, lineHeight: 1.55, maxWidth: 520, margin: "0 auto" }}>
            Type a keyword from their message in the search bar above, or tap one of the common triggers.
            You'll see the matching macro to copy and the escalation flag if there is one.
          </div>
        </div>
      )}

      {/* Results — decisions first ("what kind of email is this"),
          then macros ("ready replies") */}
      {hasQuery && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
            {totalMatches === 0
              ? `No matches for "${query}"`
              : `Results for "${query}" · ${totalMatches} ${totalMatches === 1 ? "match" : "matches"}`}
          </div>

          {totalMatches === 0 && (
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.65 }}>
              Nothing matched "{query}". Try a different keyword, or tap one of the common triggers above. If you've tried a few and still aren't sure — that's a sign to flag to a manager.
            </div>
          )}

          {/* Decision-tree matches: training context for what kind of
              ticket this is. Approach text is framed as "Tips for this
              ticket" — the team uses these as cold-onboarding training,
              not just lookup. No tag / category labels (tags go in Gorgias). */}
          {matchingDecisions.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                What kind of email is this? · {matchingDecisions.length}
              </div>
              {matchingDecisions.map((d, i) => {
                const esc = String(d.escalate || "").toLowerCase();
                const needsEscalation = esc.includes("flag") || esc.includes("escalate");
                return (
                  <div key={i} style={{
                    background: W,
                    border: "1px solid " + (needsEscalation ? RED : SOFT_BORDER),
                    borderLeft: "4px solid " + (needsEscalation ? RED : GOLD),
                    borderRadius: 10, padding: "12px 16px", marginBottom: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 700, flex: 1 }}>
                        {d.trigger}
                      </span>
                      {needsEscalation && (
                        <span style={{ fontFamily: F.sans, fontSize: 10, color: RED, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: "#fee", padding: "3px 8px", borderRadius: 4 }}>
                          Flag manager first
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                      Tips for this ticket
                    </div>
                    {/* Bullet-list rendering when we've reformatted the
                        approach text into proper bullets (all 23 decisions
                        as of 2026-05-15). Falls back to the prose form if
                        a future-added decision lacks bullets. */}
                    {(d.approachBullets ?? []).length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.55 }}>
                        {d.approachBullets.map((b, bi) => (
                          <li key={bi} style={{ marginBottom: 4 }}>{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                        {d.approach}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Macro matches — two display modes depending on whether the
              macro is in Gorgias yet:
              • IN GORGIAS (green pill): the primary action is "Copy name"
                — the agent pastes the name into Gorgias's macro search
                and inserts the macro from there. Body shown for reference.
              • NOT IN GORGIAS (amber pill): the primary action is "Copy
                body" — the agent pastes the body straight into the reply.
                Body shown prominently. */}
          {matchingMacros.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                Ready replies · {matchingMacros.length}
              </div>
              {matchingMacros.map((m, i) => {
                const inG = !!m.inGorgias;
                const pillBg = inG ? "#E8F4EA" : "#FCEFD9";
                const pillFg = inG ? "#1F5C2E" : "#7A4A05";
                const pillBorder = inG ? "#B8DDC2" : "#E8C994";
                return (
                  <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                    <div style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 700, marginBottom: 8 }}>
                      {m.trigger}
                    </div>
                    {/* Status pill + primary action */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                        color: pillFg, background: pillBg, border: "1px solid " + pillBorder,
                        padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap",
                      }}>
                        {inG ? "✓ In Gorgias" : "Not in Gorgias yet"}
                      </span>
                      {inG ? (
                        <>
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: BURG, fontWeight: 700, background: CREAM, padding: "4px 10px", borderRadius: 4 }}>
                            {m.gorgiasMacro}
                          </span>
                          <CopyButton text={m.gorgiasMacro} label="Copy name" macroName={m.gorgiasMacro} copyType="name" inGorgias={true} />
                        </>
                      ) : (
                        <>
                          <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.65, fontStyle: "italic" }}>
                            Copy the body and paste it into your Gorgias reply.
                          </span>
                          <CopyButton text={m.response} label="Copy body" macroName={m.gorgiasMacro} copyType="body" inGorgias={false} />
                        </>
                      )}
                    </div>
                    {/* Body — shown for reference when in Gorgias, primary action target when not */}
                    <div style={{
                      fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      background: CREAM,
                      padding: "10px 12px",
                      borderRadius: 6,
                      opacity: inG ? 0.75 : 1,
                    }}>
                      {m.response}
                    </div>
                    {m.note && (
                      <div style={{ marginTop: 6, fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.6 }}>
                        Note: {m.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Guiding principles — collapsed accordion at the bottom.
          Available when curious, out of the way otherwise. */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setPrinciplesOpen((o) => !o)}
          style={{
            background: "transparent", border: "1px solid " + SOFT_BORDER,
            borderRadius: 10, padding: "10px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
          }}
        >
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.5 }}>
            {principlesOpen ? "▾" : "▸"}
          </span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Guiding principles
          </span>
        </button>
        {principlesOpen && (
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "14px 18px" }}>
            {principles.map((p, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: i < principles.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.55 }}>
                <span style={{ color: BURG, fontWeight: 700 }}>{p.title}.</span>{" "}
                <span style={{ opacity: 0.85 }}>{p.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Macros sub-tab ──────────────────────────────────────────────────
// All 7 macro categories. Each macro is a collapsible card showing the
// trigger as the header; expanded reveals the full response + a copy
// button. Search filters across trigger and response text.
function AffiliatesMacros({ query }) {
  const categories = AFFILIATES_DATA.macros ?? [];
  const [expanded, setExpanded] = useState({}); // keyed "catIdx:itemIdx"
  const q = query.trim().toLowerCase();

  // Filter at the item level so empty categories collapse out of view.
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: q
        ? cat.items.filter((m) =>
            (m.trigger + " " + m.tag + " " + m.response).toLowerCase().includes(q)
          )
        : cat.items,
    }))
    .filter((cat) => cat.items.length > 0);

  const totalShown = filteredCategories.reduce((n, c) => n + c.items.length, 0);
  const totalAll = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
        Macros · {totalShown} of {totalAll}
        {q && <span style={{ opacity: 0.6, fontWeight: 500 }}> — searching for "{query}"</span>}
      </div>

      {filteredCategories.length === 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
          No macros match your search.
        </div>
      )}

      {filteredCategories.map((cat, ci) => (
        <div key={cat.category} style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid " + GOLD }}>
            {cat.category}
          </div>
          {cat.items.map((m, mi) => {
            const key = `${ci}:${mi}`;
            const isOpen = !!expanded[key];
            const inG = !!m.inGorgias;
            const pillBg = inG ? "#E8F4EA" : "#FCEFD9";
            const pillFg = inG ? "#1F5C2E" : "#7A4A05";
            const pillBorder = inG ? "#B8DDC2" : "#E8C994";
            return (
              <div key={key} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                <button
                  onClick={() => setExpanded((cur) => ({ ...cur, [key]: !cur[key] }))}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    padding: "12px 18px", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.5 }}>{isOpen ? "▾" : "▸"}</span>
                  <span style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 600, flex: 1 }}>
                    {m.trigger}
                  </span>
                  {/* Compact status pill in the collapsed-header row */}
                  <span style={{
                    fontFamily: F.sans, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                    color: pillFg, background: pillBg, border: "1px solid " + pillBorder,
                    padding: "2px 7px", borderRadius: 99, whiteSpace: "nowrap",
                  }}>
                    {inG ? "✓ Gorgias" : "Paste body"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 18px 16px 38px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      {inG ? (
                        <>
                          <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                            In Gorgias — copy name to insert
                          </span>
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: BURG, fontWeight: 700, background: CREAM, padding: "4px 10px", borderRadius: 4 }}>
                            {m.gorgiasMacro}
                          </span>
                          <CopyButton text={m.gorgiasMacro} label="Copy name" macroName={m.gorgiasMacro} copyType="name" inGorgias={true} />
                        </>
                      ) : (
                        <>
                          <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                            Not in Gorgias yet — paste body directly
                          </span>
                          <CopyButton text={m.response} label="Copy body" macroName={m.gorgiasMacro} copyType="body" inGorgias={false} />
                        </>
                      )}
                    </div>
                    <div style={{
                      fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6,
                      whiteSpace: "pre-wrap", background: CREAM, padding: "12px 14px",
                      borderRadius: 6,
                      opacity: inG ? 0.75 : 1,
                    }}>
                      {m.response}
                    </div>
                    {m.note && (
                      <div style={{ marginTop: 8, fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.6 }}>
                        Note: {m.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Program sub-tab ──────────────────────────────────────────────────
// The overview content from Kendra's PROGRAM OVERVIEW sheet. Each
// heading is a section; each item is a label/body pair. Searchable.
function AffiliatesProgram({ query }) {
  const sections = AFFILIATES_DATA.overview ?? [];
  const q = query.trim().toLowerCase();

  const filtered = q
    ? sections
        .map((sec) => ({
          ...sec,
          items: sec.items.filter((it) =>
            (sec.heading + " " + it.label + " " + it.body).toLowerCase().includes(q)
          ),
        }))
        .filter((sec) => sec.items.length > 0 || (q && sec.heading.toLowerCase().includes(q)))
    : sections.filter((sec) => sec.items.length > 0);

  return (
    <div>
      {filtered.length === 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
          No program-overview sections match your search.
        </div>
      )}
      {filtered.map((sec, si) => (
        <div key={si} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid " + GOLD }}>
            {sec.heading}
          </div>
          {sec.items.map((it, ii) => (
            <div key={ii} style={{ padding: "10px 0", borderBottom: ii < sec.items.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                {it.label}
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {it.body}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Links sub-tab ──────────────────────────────────────────────────
// Knowledge base — all URLs CS needs, grouped by section.
function AffiliatesLinks({ query }) {
  const groups = AFFILIATES_DATA.links ?? [];
  const q = query.trim().toLowerCase();

  // Defensive URL sanitiser. Cherie May 18 — a Links row had two URLs
  // and a "Sign in via Shopify" instruction smushed into one `url`
  // string, breaking the anchor (clicked to a 404, displayed as one
  // long broken line). The data is fixed at source now, but this
  // strips any non-URL crud (newlines, extra text after a space) so
  // a future bad row degrades gracefully — first whitespace-delimited
  // token wins.
  const cleanUrl = (raw) => {
    if (!raw) return "";
    const first = String(raw).trim().split(/\s+/)[0];
    return first || "";
  };

  const filtered = q
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter((it) =>
            (g.heading + " " + it.title + " " + it.url + " " + it.purpose).toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.items.length > 0)
    : groups.filter((g) => g.items.length > 0);

  return (
    <div>
      {filtered.length === 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
          No links match your search.
        </div>
      )}
      {filtered.map((g, gi) => {
        const isInternal = String(g.heading || "").toUpperCase().includes("INTERNAL");
        return (
          <div key={gi} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid " + (isInternal ? RED : GOLD) }}>
              <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, flex: 1 }}>
                {g.heading}
              </div>
              {isInternal && (
                <span style={{ fontFamily: F.sans, fontSize: 10, color: RED, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: "#fee", padding: "3px 8px", borderRadius: 4 }}>
                  Do not share
                </span>
              )}
            </div>
            {g.items.map((it, ii) => (
              <div key={ii} style={{ padding: "10px 0", borderBottom: ii < g.items.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, fontWeight: 700, flex: 1 }}>
                    {it.title}
                  </div>
                  {(() => {
                    const safeUrl = cleanUrl(it.url);
                    if (!safeUrl) return null;
                    return (
                      <>
                        <a href={safeUrl} target="_blank" rel="noreferrer" style={{
                          fontFamily: F.sans, fontSize: 11, color: BURG, textDecoration: "underline",
                          wordBreak: "break-all", maxWidth: 480, opacity: 0.75,
                        }}>{safeUrl}</a>
                        <CopyButton text={safeUrl} label="Copy URL" />
                      </>
                    );
                  })()}
                </div>
                {it.purpose && (
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {it.purpose}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Ask the Playbook sub-tab ────────────────────────────────────
// Stage 2 of the affiliates rollout. Agent pastes the affiliate's email,
// AI returns: a suggested macro, escalation flag if any, rationale, and
// any policy reminders (e.g. "don't mention reward tiers — not public
// yet"). Backed by /api/affiliates/suggest which calls Claude with
// AFFILIATES_DATA as grounding context, so the model can ONLY pick
// macros that exist and follows our policy rules.
function AffiliatesAskPlaybook() {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [rawText, setRawText] = useState(null);
  // Chat-continue state — for the "Refine this" affordance below the
  // structured suggestion. Lets agents ask follow-ups on edge cases
  // (Cherie May 18) without losing the anti-hallucination grounding
  // that the structured /suggest endpoint provides.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // [{ role, content }]
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Flat lookup of every macro by gorgiasMacro name so we can render
  // the suggested macro with its full info (body, inGorgias status).
  const macroByName = useMemo(() => {
    const m = {};
    for (const cat of AFFILIATES_DATA.macros ?? []) {
      for (const item of cat.items ?? []) {
        if (item.gorgiasMacro) m[item.gorgiasMacro] = item;
      }
    }
    return m;
  }, []);

  async function submit() {
    if (!emailText.trim()) {
      setError("Paste the affiliate's email first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setRawText(null);
    // New suggestion = reset any in-progress refine chat — the old
    // chat history was about a different email.
    setChatOpen(false);
    setChatHistory([]);
    setChatInput("");
    setChatError(null);
    try {
      const res = await fetch("/api/affiliates/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText: emailText.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.suggestion) {
        setSuggestion(json.suggestion);
      } else {
        // Parse failed — surface raw text so the agent can still read it
        setRawText(json.rawText || "(empty response)");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setEmailText("");
    setSuggestion(null);
    setRawText(null);
    setError(null);
    setChatOpen(false);
    setChatHistory([]);
    setChatInput("");
    setChatError(null);
  }

  // Send a follow-up message to /api/affiliates/suggest/refine. The
  // endpoint takes the original email + initial suggestion + running
  // history so it stays grounded in the same playbook the structured
  // suggestion came from.
  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const nextHistory = [...chatHistory, { role: "user", content: text }];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch("/api/affiliates/suggest/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailText: emailText.trim(),
          initialSuggestion: suggestion,
          history: nextHistory,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setChatHistory((cur) => [...cur, { role: "assistant", content: json.reply || "(empty reply)" }]);
    } catch (e) {
      setChatError(e.message);
    } finally {
      setChatLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    fontFamily: F.sans, fontSize: 14, color: INK, lineHeight: 1.55,
    background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
    padding: "12px 14px", resize: "vertical", outline: "none",
  };

  const confColor = (c) => c === "high" ? "#3B7A4F" : c === "medium" ? GOLD : RED;

  return (
    <div>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Paste the email for a suggestion on how to handle
        </div>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder={"Paste the affiliate's email here — the full message or just the question.\n\nThe AI will read it against the playbook and suggest a macro + flag any escalation."}
          rows={10}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = BURG)}
          onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={submit}
            disabled={loading || !emailText.trim()}
            style={{
              background: BURG, color: CREAM, border: "1px solid " + BURG,
              fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px",
              letterSpacing: 1.5, textTransform: "uppercase",
              cursor: loading || !emailText.trim() ? "not-allowed" : "pointer",
              borderRadius: 99, opacity: loading || !emailText.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Thinking…" : "Suggest a macro"}
          </button>
          {(emailText || suggestion || rawText) && (
            <button
              onClick={clearAll}
              disabled={loading}
              style={{
                background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER,
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
              }}
            >Clear</button>
          )}
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 12, color: INK, opacity: 0.55 }}>
            Typically 3-8 seconds. The suggestion is grounded in the playbook — it can't invent macro names or rules.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, fontFamily: F.sans, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {rawText && (
        <div style={{ background: W, border: "1px solid " + GOLD, borderLeft: "4px solid " + GOLD, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
            AI response (couldn't parse cleanly — raw output below)
          </div>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: INK, whiteSpace: "pre-wrap", background: CREAM, padding: "10px 12px", borderRadius: 6 }}>
            {rawText}
          </div>
        </div>
      )}

      {suggestion && (
        <div>
          {/* Escalation banner — shown first so it can't be missed */}
          {suggestion.escalate?.required && (
            <div style={{ background: "#fee", border: "1px solid " + RED, borderLeft: "4px solid " + RED, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: RED, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                ⚠ Escalate first — flag to {suggestion.escalate.to || "manager"}
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.55 }}>
                {suggestion.escalate.reason || "This case is outside the standard SOP."}
              </div>
            </div>
          )}

          {/* Plain-English summary — always rendered, separate from the
              macro/rationale rationale so the agent gets a quick read
              of what the affiliate is actually asking before diving in. */}
          {suggestion.summary && (
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "4px solid " + BURG, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                Summary
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                {suggestion.summary}
              </div>
            </div>
          )}

          {/* Recommended macro */}
          {suggestion.recommendedMacro?.name ? (() => {
            const macroName = suggestion.recommendedMacro.name;
            const macro = macroByName[macroName];
            const inG = macro?.inGorgias ?? !!suggestion.recommendedMacro.inGorgias;
            const pillBg = inG ? "#E8F4EA" : "#FCEFD9";
            const pillFg = inG ? "#1F5C2E" : "#7A4A05";
            const pillBorder = inG ? "#B8DDC2" : "#E8C994";
            return (
              <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
                    Recommended macro
                  </span>
                  <span style={{
                    fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                    color: pillFg, background: pillBg, border: "1px solid " + pillBorder,
                    padding: "3px 8px", borderRadius: 99,
                  }}>
                    {inG ? "✓ In Gorgias" : "Not in Gorgias yet"}
                  </span>
                  <span style={{ marginLeft: "auto", fontFamily: F.sans, fontSize: 11, color: confColor(suggestion.confidence), fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    {suggestion.confidence || "—"} confidence
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 13, color: BURG, fontWeight: 700, background: CREAM, padding: "6px 12px", borderRadius: 4 }}>
                    {macroName}
                  </span>
                  {inG ? (
                    <CopyButton text={macroName} label="Copy name" macroName={macroName} copyType="name" inGorgias={true} />
                  ) : macro?.response ? (
                    <CopyButton text={macro.response} label="Copy body" macroName={macroName} copyType="body" inGorgias={false} />
                  ) : null}
                </div>

                {macro?.trigger && (
                  <div style={{ fontFamily: F.serif, fontSize: 13, color: INK, opacity: 0.7, fontStyle: "italic", marginBottom: 10 }}>
                    Matches: {macro.trigger}
                  </div>
                )}

                {suggestion.rationale && (
                  <>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                      Why this macro
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.55, marginBottom: macro?.response ? 12 : 0 }}>
                      {suggestion.rationale}
                    </div>
                  </>
                )}

                {macro?.response && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                      Preview macro body
                    </summary>
                    <div style={{
                      marginTop: 8,
                      fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.6,
                      whiteSpace: "pre-wrap", background: CREAM, padding: "10px 12px",
                      borderRadius: 6,
                    }}>
                      {macro.response}
                    </div>
                  </details>
                )}
              </div>
            );
          })() : (
            <div style={{ background: W, border: "1px solid " + GOLD, borderLeft: "4px solid " + GOLD, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
                  No clear macro found
                </span>
                <span style={{ marginLeft: "auto", fontFamily: F.sans, fontSize: 11, color: confColor(suggestion.confidence), fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                  {suggestion.confidence || "—"} confidence
                </span>
              </div>
              <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 700, marginBottom: 8 }}>
                This case is outside the standard SOP — use the holding reply below while it routes.
              </div>
              {suggestion.rationale && (
                <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, opacity: 0.75, lineHeight: 1.55, marginBottom: 12, fontStyle: "italic" }}>
                  {suggestion.rationale}
                </div>
              )}
              {suggestion.suggestedResponse ? (
                <>
                  <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                    Suggested holding reply
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap", background: CREAM, padding: "12px 14px", borderRadius: 6, marginBottom: 10 }}>
                    {suggestion.suggestedResponse}
                  </div>
                  <CopyButton text={suggestion.suggestedResponse} label="Copy reply" />
                </>
              ) : (
                <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, fontStyle: "italic" }}>
                  No holding reply drafted — review the decision tree manually and escalate.
                </div>
              )}
            </div>
          )}

          {/* Extra policy notes for the agent */}
          {Array.isArray(suggestion.flagsForAgent) && suggestion.flagsForAgent.length > 0 && (
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "4px solid " + GOLD, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                Before you send — notes
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                {suggestion.flagsForAgent.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Refine-this chat — opt-in expand for the 5% of edge cases
              where an agent needs to ask follow-ups. Stays grounded in
              the same playbook + tone guide as the structured panel. */}
          <div style={{ marginTop: 4 }}>
            {!chatOpen ? (
              <button
                onClick={() => setChatOpen(true)}
                style={{
                  background: "transparent",
                  color: BURG,
                  border: "1px dashed " + BURG,
                  fontFamily: F.sans, fontSize: 12, fontWeight: 700,
                  padding: "10px 16px", letterSpacing: 1, textTransform: "uppercase",
                  cursor: "pointer", borderRadius: 8,
                }}
              >
                💬 Refine this — ask a follow-up
              </button>
            ) : (
              <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
                    Refine this — chat
                  </div>
                  <button
                    onClick={() => { setChatOpen(false); setChatHistory([]); setChatInput(""); setChatError(null); }}
                    style={{
                      background: "transparent", color: INK, opacity: 0.5,
                      border: "none", fontSize: 11, cursor: "pointer",
                      fontFamily: F.sans, padding: 0,
                    }}
                  >
                    × Close
                  </button>
                </div>

                {chatHistory.length === 0 && (
                  <div style={{ fontFamily: F.serif, fontSize: 13, fontStyle: "italic", color: INK, opacity: 0.55, marginBottom: 12, lineHeight: 1.5 }}>
                    Ask a follow-up about this case. The AI keeps the original email and the suggestion above as context — try things like “Make the holding reply shorter,” “What if they're a VIP?,” or “Does the May 13 SOP cover this?”
                  </div>
                )}

                {chatHistory.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                    {chatHistory.map((m, i) => {
                      const isUser = m.role === "user";
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                          <div style={{
                            fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.5,
                            letterSpacing: 1, textTransform: "uppercase", fontWeight: 700,
                            marginBottom: 4,
                          }}>
                            {isUser ? "You" : "AI"}
                          </div>
                          <div style={{
                            maxWidth: "85%",
                            background: isUser ? BURG : CREAM,
                            color: isUser ? CREAM : INK,
                            fontFamily: F.sans, fontSize: 13, lineHeight: 1.55,
                            padding: "10px 14px", borderRadius: 10,
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            border: isUser ? "1px solid " + BURG : "1px solid " + SOFT_BORDER,
                          }}>
                            {m.content}
                          </div>
                          {!isUser && (
                            <div style={{ marginTop: 6 }}>
                              <CopyButton text={m.content} label="Copy reply" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {chatLoading && (
                  <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 12, color: INK, opacity: 0.55, marginBottom: 12 }}>
                    Thinking…
                  </div>
                )}
                {chatError && (
                  <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 10, fontFamily: F.sans, fontSize: 12 }}>
                    {chatError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter sends; shift+enter keeps the newline so the
                      // agent can write a longer follow-up if they need to.
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder={chatLoading ? "Thinking…" : "Ask a follow-up… (Enter to send, Shift+Enter for newline)"}
                    rows={2}
                    disabled={chatLoading}
                    style={{
                      flex: 1, boxSizing: "border-box",
                      fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5,
                      background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
                      padding: "10px 12px", resize: "vertical", outline: "none",
                      opacity: chatLoading ? 0.6 : 1,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BURG)}
                    onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      background: BURG, color: CREAM,
                      border: "1px solid " + BURG,
                      fontFamily: F.sans, fontSize: 12, fontWeight: 700,
                      padding: "10px 16px", letterSpacing: 1, textTransform: "uppercase",
                      cursor: (chatLoading || !chatInput.trim()) ? "not-allowed" : "pointer",
                      borderRadius: 8, opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1,
                      alignSelf: "stretch",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats sub-tab ──────────────────────────────────────────────
// Manager+ only. Shows which macros are getting copied most via the
// hub's Copy buttons. Two split lists:
//   1) "Not in Gorgias yet" — the priority list for what to add next.
//      If a macro here is getting hammered, it's a great candidate
//      for the next Gorgias batch.
//   2) "In Gorgias" — workhorse macros; informational.
// Configurable date window. Refetches when the window changes.
function AffiliatesStats() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/affiliates/copy/stats?days=${days}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setData(json);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const notInGorgias = (data?.stats ?? []).filter((s) => !s.inGorgias);
  const inGorgias = (data?.stats ?? []).filter((s) => s.inGorgias);

  const Range = ({ value, label }) => {
    const active = days === value;
    return (
      <button onClick={() => setDays(value)} style={{
        background: active ? BURG : "transparent",
        color: active ? CREAM : BURG,
        border: "1px solid " + (active ? BURG : SOFT_BORDER),
        fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "6px 14px",
        letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
      }}>{label}</button>
    );
  };

  const List = ({ heading, accent, items, emptyMsg }) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid " + accent }}>
        <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, flex: 1 }}>{heading}</div>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, fontWeight: 600 }}>
          {items.length} {items.length === 1 ? "macro" : "macros"}
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55 }}>{emptyMsg}</div>
      ) : (
        items.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 13, color: INK }}>
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: BURG, fontWeight: 700, flex: 1 }}>
              {s.macroName || "(unknown)"}
            </span>
            <span style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, minWidth: 50, textAlign: "right" }}>
              {s.count.toLocaleString()}
            </span>
            <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginLeft: 6 }}>
              {s.count === 1 ? "click" : "clicks"}
            </span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      {/* Range chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Range value={7} label="Last 7 days" />
        <Range value={30} label="Last 30 days" />
        <Range value={90} label="Last 90 days" />
      </div>

      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, fontFamily: F.sans, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {!loading && !error && data && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
            {data.totalClicks?.toLocaleString() ?? 0} total copy click{data.totalClicks === 1 ? "" : "s"} · last {data.days} days
          </div>

          <List
            heading="Not in Gorgias yet — your priority list"
            accent={GOLD}
            items={notInGorgias}
            emptyMsg="Nothing copied yet in this window. As the team starts using macros not in Gorgias, they'll surface here ranked by demand."
          />

          <List
            heading="In Gorgias — workhorses"
            accent={SOFT_BORDER}
            items={inGorgias}
            emptyMsg="No in-Gorgias macros have been copied in this window yet."
          />
        </>
      )}
    </div>
  );
}

// Trustpilot lifetime stats — kept as plain constants, refreshed manually
// by visiting https://www.trustpilot.com/review/withluma.com.au and copying
// the current values. Cherie's call: skip the API integration (Business
// tier + key dance) and just show the public-facing numbers on the hub.
// Last refreshed 2026-05-15.
const TRUSTPILOT_STATS = {
  trustScore: 4.6,
  totalReviews: 1355,
  // Percentages by star, as shown on the Trustpilot profile page.
  // Numeric counts are computed on the fly.
  distribution: {
    fiveStar: 84,
    fourStar: 6,
    threeStar: 2,
    twoStar: 2,
    oneStar: 6,
  },
  url: "https://www.trustpilot.com/",
  lastUpdated: "2026-05-15",
};

// Render a star row of filled + outlined stars in tile-row coloring.
const tpRenderStars = (n) => "★".repeat(n) + "☆".repeat(5 - n);



// ─── ASK LUMÉ SLIDE-OVER ─────────────────────────────────────────────────────
// Opens from anywhere (floating button, Cmd+K, Home hero) without a page
// navigation, so agents never lose their place mid-ticket. Structured
// answers render as cards; the copy button grabs only the customer draft.

const ASK_CHIPS = [
  "Refund outside 30 days?",
  "Customer reports tingling",
  "Wrong serums in Hair Edit box",
  "How do I save a cancel?",
];

function AskSectionCard({ title, accent, children, actions }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + accent, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", color: accent === GOLD ? GOLD : BURG }}>{title}</div>
        {actions}
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function AskPanel({ open, onClose, chatMsgs, chatInput, setChatInput, chatLoading, sendChat, chatEndRef }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 160);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function copyDraft(text, idx) {
    try { navigator.clipboard.writeText(text.trim()); } catch { /* ignore */ }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1600);
  }

  // Strip markdown decoration from the draft so what lands in the
  // clipboard is exactly what gets pasted to the customer.
  function plainDraft(body) {
    return body.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^#{1,4}\s+/gm, "").trim();
  }

  const empty = chatMsgs.length <= 1;

  function renderAssistant(m, i) {
    const parsed = parseAskSections(m.content);
    if (!parsed) {
      return (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: "14px 14px 14px 4px", padding: "12px 16px", fontFamily: F.sans, fontSize: 13, lineHeight: 1.6, color: INK }}>
          {renderChatMarkdown(m.content)}
        </div>
      );
    }
    const byKey = Object.fromEntries(parsed.sections.map((sec) => [sec.key, sec.body]));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {parsed.intro && (
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.8, lineHeight: 1.55 }}>{renderChatMarkdown(parsed.intro)}</div>
        )}
        {byKey["QUICK DECISION"] && (
          <AskSectionCard title="Quick decision" accent={GOLD}>
            {renderChatMarkdown(byKey["QUICK DECISION"])}
          </AskSectionCard>
        )}
        {byKey["SUGGESTED REPLY"] && (
          <AskSectionCard
            title="Suggested reply"
            accent={BURG}
            actions={
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => copyDraft(plainDraft(byKey["SUGGESTED REPLY"]), i)}
                  style={{ background: copiedIdx === i ? BURG : "transparent", color: copiedIdx === i ? CREAM : BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 99, cursor: "pointer" }}
                >
                  {copiedIdx === i ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => notify("Draft inserted into ticket #4821 — demo")}
                  style={{ background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  Insert into Gorgias
                </button>
              </div>
            }
          >
            <div style={{ fontFamily: F.serif, fontSize: 14, lineHeight: 1.65 }}>{renderChatMarkdown(byKey["SUGGESTED REPLY"])}</div>
          </AskSectionCard>
        )}
        {byKey["IF THEY PUSH BACK"] && (
          <AskSectionCard title="If they push back" accent="#A5544A">
            {renderChatMarkdown(byKey["IF THEY PUSH BACK"])}
          </AskSectionCard>
        )}
      </div>
    );
  }

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,10,9,0.18)", zIndex: 190 }} />
      )}
      <div
        role="dialog"
        aria-label="Ask LUMÉ"
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(470px, 100vw)", background: CREAM, borderLeft: "1px solid " + SOFT_BORDER, boxShadow: open ? "-16px 0 44px rgba(10,10,9,0.16)" : "none", zIndex: 200, transform: open ? "translateX(0)" : "translateX(103%)", transition: "transform 0.22s ease", display: "flex", flexDirection: "column" }}
      >
        <div style={{ background: W, padding: "16px 20px", borderBottom: "1px solid " + SOFT_BORDER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 600, color: BURG }}>Ask LUMÉ</div>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>Policy, tricky tickets, what to write back.</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, width: 30, height: 30, borderRadius: 99, cursor: "pointer", fontFamily: F.sans, fontSize: 14, lineHeight: "26px", padding: 0 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {chatMsgs.map((m, i) => {
            const isUser = m.role === "user";
            if (isUser) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "85%", background: BURG, color: CREAM, fontFamily: F.sans, fontSize: 13, lineHeight: 1.55, padding: "10px 14px", borderRadius: "14px 14px 4px 14px", whiteSpace: "pre-wrap" }}>{m.content}</div>
                </div>
              );
            }
            return <div key={i}>{renderAssistant(m, i)}</div>;
          })}
          {chatLoading && (
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.5 }}>Thinking</div>
          )}
          {empty && !chatLoading && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: INK, opacity: 0.5, marginBottom: 8 }}>Try one of these</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ASK_CHIPS.map((c) => (
                  <button key={c} onClick={() => sendChat(c)} style={{ background: W, border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 12, padding: "8px 14px", borderRadius: 99, cursor: "pointer" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ background: W, borderTop: "1px solid " + SOFT_BORDER, padding: "12px 14px", display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            placeholder="Ask about policy, a tricky ticket, what to write back…"
            style={{ flex: 1, fontFamily: F.sans, fontSize: 13, padding: "10px 14px", border: "1px solid " + SOFT_BORDER, borderRadius: 8, outline: "none", background: CREAM }}
          />
          <button onClick={() => sendChat()} disabled={chatLoading || !chatInput.trim()} style={{ background: chatLoading || !chatInput.trim() ? SOFT_BORDER : BURG, color: CREAM, fontFamily: F.sans, fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", padding: "10px 18px", border: "none", borderRadius: 8, cursor: chatLoading || !chatInput.trim() ? "default" : "pointer" }}>Send</button>
        </div>
      </div>
    </>
  );
}

// Subtle floating access button — bottom right on every screen.
function FloatingAskButton({ onClick, hidden }) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      title="Ask LUMÉ (⌘K)"
      style={{ position: "fixed", bottom: 22, right: 22, zIndex: 120, background: W, border: "1px solid " + GOLD, color: BURG, borderRadius: 99, padding: "10px 18px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, cursor: "pointer", boxShadow: "0 6px 20px rgba(10,10,9,0.12)", display: "flex", alignItems: "center", gap: 8 }}
    >
      <span aria-hidden="true" style={{ color: GOLD, fontStyle: "normal", fontSize: 12 }}>✳</span>
      Ask LUMÉ
    </button>
  );
}

// ─── COMMAND PALETTE (Cmd+K) ─────────────────────────────────────────────────
// Global fuzzy launcher: actions, navigation, Playbook search, and an
// "Ask LUMÉ" fallthrough. Cream panel, serif section headers, mono keys.

const PALETTE_QA = [];
function paletteQA() {
  if (PALETTE_QA.length === 0) {
    for (const src of [POLICY_QA, COMMON_PRODUCT_QA, ABOUT_BRAND_QA]) {
      for (const item of src || []) {
        if (item?.q && item?.a) PALETTE_QA.push({ q: item.q, a: item.a });
      }
    }
  }
  return PALETTE_QA;
}

function CommandPalette({ open, onClose, role, setTab, requestLogsSub, requestPlaybookQuery, openAsk }) {
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHi(0);
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const match = (label) => !q || label.toLowerCase().includes(q);

  const canLogs = canAccessTab("Logs", role);
  const actionItems = !canLogs ? [] : [
    { section: "Actions", label: "Log order issue", hint: "Logs · Order Issue", run: () => { setTab("Logs"); requestLogsSub("Order Issue"); } },
    { section: "Actions", label: "Log replacement", hint: "Logs · Replacements", run: () => { setTab("Logs"); requestLogsSub("Replacements"); } },
    { section: "Actions", label: "Log reaction / concern", hint: "Logs · Reaction", run: () => { setTab("Logs"); requestLogsSub("Reaction/Concern"); } },
    { section: "Actions", label: "Log feedback", hint: "Logs · Feedback", run: () => { setTab("Logs"); requestLogsSub("Feedback"); } },
    { section: "Actions", label: "New 3PL claim", hint: "Logs · 3PL Claim", run: () => { setTab("Logs"); requestLogsSub("3PL Claim"); } },
  ].filter((a) => match(a.label));

  const navItems = TABS.filter((t) => canAccessTab(t, role)).map((t) => ({
    section: "Navigate", label: "Go to " + t, hint: t, run: () => setTab(t),
  })).filter((a) => match(a.label));

  const playbookItems = q.length >= 2
    ? paletteQA()
        .filter((e) => e.q.toLowerCase().includes(q) || e.a.toLowerCase().includes(q))
        .slice(0, 4)
        .map((e) => ({
          section: "Playbook",
          label: e.q,
          detail: String(e.a).replace(/\s+/g, " ").slice(0, 140) + (e.a.length > 140 ? "…" : ""),
          run: () => { setTab("Playbook"); requestPlaybookQuery(query.trim()); },
        }))
    : [];

  const askItems = q.length > 0
    ? [{ section: "Ask LUMÉ", label: `Ask LUMÉ: “${query.trim()}”`, hint: "↵", run: () => openAsk(query.trim()) }]
    : [];

  const items = [...actionItems, ...playbookItems, ...navItems, ...askItems];
  const clampedHi = Math.min(hi, Math.max(0, items.length - 1));

  function runItem(item) {
    if (!item) return;
    onClose();
    item.run();
  }

  useEffect(() => { setHi(0); }, [query]);

  if (!open) return null;

  let lastSection = null;
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(10,10,9,0.28)", zIndex: 250, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "12vh" }}>
      <div style={{ width: "min(580px, 92vw)", background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, boxShadow: "0 24px 64px rgba(10,10,9,0.24)", overflow: "hidden" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, items.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); runItem(items[clampedHi]); }
            else if (e.key === "Escape") { e.preventDefault(); onClose(); }
          }}
          placeholder="Type a command, search the Playbook, or ask a question…"
          style={{ width: "100%", boxSizing: "border-box", padding: "16px 20px", border: "none", borderBottom: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 15, color: INK, outline: "none" }}
        />
        <div style={{ maxHeight: "52vh", overflowY: "auto", padding: "6px 0 10px" }}>
          {items.length === 0 && (
            <div style={{ padding: "18px 20px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.55 }}>Nothing matches — press Enter to ask LUMÉ instead.</div>
          )}
          {items.map((item, i) => {
            const showHeader = item.section !== lastSection;
            lastSection = item.section;
            const active = i === clampedHi;
            return (
              <div key={item.section + item.label + i}>
                {showHeader && (
                  <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: GOLD, padding: "10px 20px 4px" }}>{item.section}</div>
                )}
                <div
                  onMouseEnter={() => setHi(i)}
                  onMouseDown={(e) => { e.preventDefault(); runItem(item); }}
                  style={{ padding: "9px 20px", cursor: "pointer", background: active ? CREAM : "transparent", borderLeft: active ? "2px solid " + GOLD : "2px solid transparent" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontFamily: F.sans, fontSize: 13.5, color: INK, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                    {item.hint && (
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, color: INK, opacity: 0.45, whiteSpace: "nowrap" }}>{item.hint}</span>
                    )}
                  </div>
                  {item.detail && (
                    <div style={{ fontFamily: F.sans, fontSize: 11.5, color: INK, opacity: 0.55, marginTop: 2, lineHeight: 1.45 }}>{item.detail}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid " + SOFT_BORDER, padding: "8px 20px", display: "flex", gap: 16, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, color: INK, opacity: 0.45 }}>
          <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}

// ─── SIMULATE TAB ─────────────────────────────────────────────────────────────
function SimTab({ selScen, setSelScen, simMsgs, simInput, setSimInput, simLoading, simFeedback, simDone, sendSim, startScen, simEndRef }) {
  if (!selScen) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>Simulation Scenarios</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#aaa", textAlign: "center", marginBottom: 24 }}>Practice handling real customer situations. After 2 exchanges you receive coach feedback.</div>
        <div className="luma-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SCENARIOS.map(scen => (
            <div key={scen.id} onClick={() => startScen(scen)} style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: BURG }}>{scen.label}</div>
                <span style={{ background: diffColor(scen.difficulty) + "22", color: diffColor(scen.difficulty), fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>{scen.difficulty}</span>
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 12, color: "#777", lineHeight: 1.5 }}>
                {scen.customerMsg.length > 80 ? scen.customerMsg.slice(0, 80) + "..." : scen.customerMsg}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 104px)", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: W, padding: "12px 16px", borderBottom: "1px solid #e0d9d0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSelScen(null)} style={{ background: "transparent", border: "none", color: RED, fontSize: 24, cursor: "pointer", padding: 0 }}>{"←"}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG }}>{selScen.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: diffColor(selScen.difficulty) + "22", color: diffColor(selScen.difficulty), fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{selScen.difficulty}</span>
            <span style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa" }}>{simDone ? "Complete - see feedback below" : "Type your response below"}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {simMsgs.map((m, i) => {
          const isCust = m.role === "customer";
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: isCust ? "flex-start" : "flex-end" }}>
              {isCust && <div style={{ width: 32, height: 32, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F.sans, fontWeight: 700, fontSize: 13, color: W }}>C</div>}
              <div style={{ maxWidth: "75%", background: isCust ? "#fde8e8" : BURG, color: isCust ? "#333" : W, fontFamily: F.sans, fontSize: 14, lineHeight: 1.6, padding: "12px 14px", borderRadius: isCust ? "4px 16px 16px 16px" : "16px 4px 16px 16px" }}>
                {m.content}
              </div>
              {!isCust && <div style={{ width: 32, height: 32, borderRadius: "50%", background: BURG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F.sans, fontWeight: 700, fontSize: 11, color: W }}>ME</div>}
            </div>
          );
        })}
        {simLoading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 13, color: W, flexShrink: 0 }}>C</div>
            <div style={{ background: "#fde8e8", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontFamily: F.sans, fontSize: 14, color: "#aaa" }}>Typing...</div>
          </div>
        )}
        {simFeedback && (
          <div style={{ background: "#fffbf0", border: "2px solid " + GOLD, borderRadius: 12, padding: 20, marginTop: 8 }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Coach Feedback</div>
            <div style={{ fontFamily: F.sans, fontSize: 14, color: "#444", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{simFeedback}</div>
            <button onClick={() => setSelScen(null)} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 14 }}>Try Another Scenario</button>
          </div>
        )}
        <div ref={simEndRef} />
      </div>

      {!simDone && (
        <div style={{ background: W, borderTop: "1px solid #e0d9d0", padding: "12px 16px", display: "flex", gap: 10 }}>
          <input
            value={simInput}
            onChange={e => setSimInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSim(); } }}
            placeholder="Type your customer service response..."
            style={{ flex: 1, fontFamily: F.sans, fontSize: 14, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none" }}
          />
          <button onClick={sendSim} disabled={simLoading || !simInput.trim()} style={{ background: simLoading || !simInput.trim() ? "#ccc" : RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 20px", border: "none", borderRadius: 8, cursor: simLoading || !simInput.trim() ? "default" : "pointer" }}>Reply</button>
        </div>
      )}
    </div>
  );
}

// ─── COMPARE TAB ──────────────────────────────────────────────────────────────
function CompareMatrix({ showDiscontinued = true }) {
  const allHeaders = [
    { label: "Smooth Serum", disc: false, key: "smooth" },
    { label: "Repair Serum", disc: false, key: "repair" },
    { label: "Scalp Serum",  disc: false, key: "scalp" },
    { label: "Glow Serum",   disc: false, key: "glow" },
  ];
  const headers = showDiscontinued ? allHeaders : allHeaders.filter(h => !h.disc);

  return (
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", textAlign: "center", marginBottom: 16 }}>
        The four LUMÉ serums side by side — pairings, timelines, and prices.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 480, width: "100%", borderCollapse: "collapse", background: W, borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <thead>
            <tr>
              <th style={{ padding: "14px 16px", textAlign: "left", fontFamily: F.sans, fontSize: 12, color: "#999", fontWeight: 600, borderBottom: "2px solid #f0ebe5", background: CREAM, width: 140 }}>Feature</th>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: "14px 12px", textAlign: "center", fontFamily: F.sans, fontSize: 12, fontWeight: 700, borderBottom: "2px solid #f0ebe5", background: h.disc ? "#e8e0d8" : BURG, color: h.disc ? "#999" : W, minWidth: 120 }}>
                  {h.label}
                  {h.disc && <div style={{ fontSize: 9, fontWeight: 400, color: "#bbb", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Discontinued</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? W : "#fdfbf9" }}>
                <td style={{ padding: "10px 16px", fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: "#777", borderBottom: "1px solid #f5f0eb" }}>{row.label}</td>
                {headers.map((h, ci) => (
                  <td key={ci} style={{ textAlign: "center", borderBottom: "1px solid #f5f0eb", ...cellStyle(row[h.key], h.disc) }}>{row[h.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareTab() {
  return (
    <div style={{ padding: "20px 16px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14, textAlign: "center" }}>Product Comparison</div>
      <CompareMatrix showDiscontinued={true} />
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({ totalScore, completed, sessionScores, setTab, setSelMod }) {
  const totalMods = MODULES.length;
  const overallPct = totalMods > 0 ? Math.round((completed.length / totalMods) * 100) : 0;

  function pctColor(pct) {
    if (pct >= 80) return GOLD;
    if (pct >= 60) return RED;
    return "#bbb";
  }

  const focusAreas = MODULES.filter(mod => {
    if (!completed.includes(mod.id)) return false;
    const s = sessionScores[mod.id] || 0;
    return Math.round((s / mod.questions.length) * 100) < 80;
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 40px" }}>
      {/* Total score */}
      <div style={{ background: W, borderRadius: 12, padding: 28, textAlign: "center", border: "1px solid #e0d9d0", marginBottom: 20 }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Total Score</div>
        <div style={{ fontFamily: F.serif, fontSize: 56, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{totalScore}</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#aaa", marginTop: 4 }}>{completed.length} of {totalMods} modules complete</div>
        <div style={{ background: "#f0ebe5", borderRadius: 99, height: 8, marginTop: 16 }}>
          <div style={{ background: "linear-gradient(90deg," + RED + "," + GOLD + ")", width: overallPct + "%", height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", marginTop: 6 }}>{overallPct}% complete</div>
      </div>

      {/* Per-day breakdown */}
      {[1,2,3,4,5].map(day => {
        const dayMods = MODULES.filter(m => m.day === day);
        if (!dayMods.length) return null;
        return (
          <div key={day} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{"Day " + day}</div>
            {dayMods.map(mod => {
              const score = sessionScores[mod.id];
              const done  = completed.includes(mod.id);
              const pct   = done && score !== undefined ? Math.round((score / mod.questions.length) * 100) : null;
              return (
                <div key={mod.id} style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: done ? 8 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <div style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 600, color: BURG }}>{mod.title}</div>
                      {mod.critical && <span style={{ background: RED, color: W, fontFamily: F.sans, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase" }}>Critical</span>}
                    </div>
                    {done && pct !== null ? (
                      <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: pctColor(pct) }}>{score}/{mod.questions.length} ({pct}%)</div>
                    ) : (
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#ccc" }}>not started</div>
                    )}
                  </div>
                  {done && pct !== null && (
                    <div style={{ background: "#f0ebe5", borderRadius: 99, height: 5 }}>
                      <div style={{ background: pctColor(pct), width: pct + "%", height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Focus areas */}
      {focusAreas.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>Focus Areas</div>
          {focusAreas.map(mod => {
            const score = sessionScores[mod.id] || 0;
            const pct   = Math.round((score / mod.questions.length) * 100);
            const modIdx = MODULES.findIndex(m => m.id === mod.id);
            return (
              <div key={mod.id} style={{ background: "#fff8f8", border: "1px solid rgba(164,0,17,0.25)", borderRadius: 10, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 600, color: BURG }}>{mod.title}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: RED }}>{pct}% - needs improvement</div>
                </div>
                <button
                  onClick={() => { setTab("Quiz"); setTimeout(() => setSelMod(modIdx), 50); }}
                  style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 12, padding: "8px 16px", border: "none", borderRadius: 6, cursor: "pointer" }}
                >Retry</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SpotBlock ────────────────────────────────────────────────────────────────
function SpotBlock({ label, ticket, problems, fixed }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ border: "2px solid #e0d8d0", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: "rgba(164,0,17,0.06)", padding: "10px 14px", borderBottom: "1px solid #e0d8d0", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: RED, textTransform: "uppercase", letterSpacing: 1.5 }}>🔍 {label || "Spot the Problem"}</span>
      </div>
      <div style={{ padding: "12px 14px", background: "#fff8f8", borderBottom: "1px solid #f0e0e0" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Agent Response — What's Wrong Here?</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#555", lineHeight: 1.7, fontStyle: "italic" }}>"{ticket}"</div>
      </div>
      {!revealed ? (
        <div style={{ padding: "12px 14px" }}>
          <button onClick={() => setRevealed(true)} style={{ background: RED, color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 22px", border: "none", borderRadius: 7, cursor: "pointer" }}>Reveal Problems</button>
        </div>
      ) : (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Problems Found</div>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: 18 }}>
            {problems.map((p, i) => <li key={i} style={{ fontFamily: F.sans, fontSize: 13, color: "#5a0008", lineHeight: 1.65, marginBottom: 5 }}>{p}</li>)}
          </ul>
          <div style={{ background: "#f0fff4", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 7, padding: "10px 13px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Better Version</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#1a4a1a", lineHeight: 1.7 }}>"{fixed}"</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ScorecardBlock ───────────────────────────────────────────────────────────
function ScorecardBlock({ context, ticket, scores, total, fixed }) {
  const [showFixed, setShowFixed] = useState(false);
  const scoreColor = s => s >= 4 ? "#2a7a2a" : s === 3 ? "#7a5e00" : "#a40011";
  const scoreBg    = s => s >= 4 ? "#f0fff4" : s === 3 ? "#fffbea" : "#fff0f0";
  const verdict = total >= 20 ? "Passes — but only just." : total >= 14 ? "Needs Coaching" : "Unacceptable";
  const verdictColor = total >= 20 ? "#2a7a2a" : total >= 14 ? "#7a5e00" : "#a40011";
  return (
    <div style={{ border: "2px solid #d0c8c0", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: BURG, padding: "10px 14px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5 }}>📋 Live QC Scoring — Work Through This</div>
      </div>
      {context && <div style={{ padding: "8px 14px", background: "#f5f0eb", borderBottom: "1px solid #e0d8d0", fontFamily: F.sans, fontSize: 12, color: "#666" }}><strong>Situation:</strong> {context}</div>}
      <div style={{ padding: "10px 14px", background: "#fff8f8", borderBottom: "1px solid #f0e0e0" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Agent Response Sent</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#555", lineHeight: 1.7, fontStyle: "italic" }}>"{ticket}"</div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Category Scores</div>
        {scores.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 48px 1fr", gap: 8, marginBottom: 8, alignItems: "start" }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: BURG }}>{s.cat}</div>
            <div style={{ background: scoreBg(s.score), border: "1px solid " + scoreColor(s.score), borderRadius: 5, padding: "2px 0", textAlign: "center", fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}/5</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: "#555", lineHeight: 1.5 }}>{s.why}</div>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "2px solid #e0d8d0", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: verdictColor }}>{total}<span style={{ fontSize: 14, fontWeight: 400, color: "#888" }}>/25</span></div>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: verdictColor }}>{verdict}</div>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888" }}>Target is 20+. This response would require immediate coaching.</div>
          </div>
        </div>
        {!showFixed ? (
          <button onClick={() => setShowFixed(true)} style={{ marginTop: 12, background: "#2a7a2a", color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 22px", border: "none", borderRadius: 7, cursor: "pointer" }}>Show 20+ Response</button>
        ) : (
          <div style={{ marginTop: 12, background: "#f0fff4", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 7, padding: "12px 14px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>What a 22+/25 Looks Like</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#1a4a1a", lineHeight: 1.75 }}>"{fixed}"</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ResultsTreeBlock ─────────────────────────────────────────────────────────
function ResultsTreeBlock() {
  const [step, setStep] = useState(0);
  const [days, setDays] = useState(null);
  const [tone, setTone] = useState(null);
  const reset = () => { setStep(0); setDays(null); setTone(null); };
  const Btn = ({ label, onClick, color }) => (
    <button onClick={onClick} style={{ background: color || BURG, color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 18px", border: "none", borderRadius: 7, cursor: "pointer", flex: 1 }}>{label}</button>
  );
  const results = {
    sub90_soft: {
      action: "Educate & One Save Attempt",
      color: "#2a7a2a", bg: "#f0fff4",
      steps: ["Educate on the 90-day clinical curve — this is how the trial was designed to work", "Normalise: 'Most customers report the biggest changes between weeks 8-12'", "Ask about consistency: 'How consistent has your daily routine been?'", "One save attempt — frame the 90 days as an investment not yet complete", "If they insist: cancel politely. Never push twice."],
      never: "Never promise specific outcomes or results timelines."
    },
    sub90_firm: {
      action: "One Attempt, Then Cancel Gracefully",
      color: "#7a5e00", bg: "#fffbea",
      steps: ["Acknowledge their experience without arguing", "One short save attempt: '90 days is the clinical window — you are X days away from the full picture'", "If they still want to cancel: process it immediately and politely", "Do NOT guilt-trip or push a second time"],
      never: "Never argue the timeline with a firm customer — it damages trust and generates chargebacks."
    },
    over90_any: {
      action: "Validate, Escalate to CS Lead, Cancel if Insisted",
      color: "#a40011", bg: "#fff0f0",
      steps: ["Validate that they gave LUMÉ a real, full trial — acknowledge this genuinely", "Escalate to CS Lead before processing anything", "CS Lead may probe routine, offer a different approach, or check in on health goals", "If the customer insists after that: cancel with full empathy and no pushback", "Tag as 'over-90-results' churn for product feedback"],
      never: "Never cancel an over-90 results ticket without escalating to CS Lead first."
    }
  };
  const resultKey = days === "over90" ? "over90_any" : tone === "soft" ? "sub90_soft" : "sub90_firm";
  const result = (days && (days === "over90" || tone)) ? results[resultKey] : null;
  return (
    <div style={{ border: "2px solid #d0c8c0", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: BURG, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5 }}>🌳 Results Decision Tree — Click Through It</div>
        {(days || tone) && <button onClick={reset} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "4px 10px", border: "none", borderRadius: 5, cursor: "pointer" }}>Reset</button>}
      </div>
      <div style={{ padding: "14px" }}>
        {/* Step 1 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Step 1 — How long has the customer been using LUMÉ?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Under 90 days" color={days === "sub90" ? RED : BURG} onClick={() => { setDays("sub90"); setTone(null); }} />
            <Btn label="90+ days (or unknown)" color={days === "over90" ? RED : BURG} onClick={() => { setDays("over90"); setTone(null); }} />
          </div>
        </div>
        {/* Step 2 — only if sub90 */}
        {days === "sub90" && (
          <div style={{ marginBottom: 12, paddingLeft: 14, borderLeft: "3px solid " + RED }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Step 2 — What is their tone?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn label={"Soft / Exploring\n\"Not sure it's working...\""} color={tone === "soft" ? "#2a7a2a" : "#666"} onClick={() => setTone("soft")} />
              <Btn label={"Firm / Decided\n\"I want to cancel\""} color={tone === "firm" ? "#a40011" : "#666"} onClick={() => setTone("firm")} />
            </div>
          </div>
        )}
        {/* Result */}
        {result && (
          <div style={{ background: result.bg, border: "2px solid " + result.color, borderRadius: 8, padding: "14px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 800, color: result.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>→ {result.action}</div>
            <ul style={{ margin: "0 0 10px 0", paddingLeft: 18 }}>
              {result.steps.map((s, i) => <li key={i} style={{ fontFamily: F.sans, fontSize: 13, color: "#333", lineHeight: 1.65, marginBottom: 4 }}>{s}</li>)}
            </ul>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: result.color, fontWeight: 700, background: "rgba(0,0,0,0.05)", borderRadius: 5, padding: "7px 10px" }}>⚠ {result.never}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BootcampTab ──────────────────────────────────────────────────────────────
function BootcampTab({ bcProgress, saveBcProgress, bcView, setBcView, bcDay, setBcDay, bcLesson, setBcLesson, bcQIdx, setBcQIdx, bcChosen, setBcChosen, bcAnswers, setBcAnswers, bcWriteInput, setBcWriteInput, bcWriteFeedback, bcWriteLoading, bcWriteDone, setBcWriteDone, setBcWriteFeedback, submitWritingExercise, playerName }) {

  const [expandedScenarios, setExpandedScenarios] = useState({});

  function isDayUnlocked(d) {
    if (d === 1) return true;
    return !!(bcProgress[d - 1] && bcProgress[d - 1].passed);
  }
  function isLessonDone(d, l) { return !!(bcProgress[d] && bcProgress[d].lessons && bcProgress[d].lessons[l]); }
  function allLessonsDone(d) { return BOOTCAMP_DAYS[d - 1].lessons.every((_, i) => isLessonDone(d, i)); }
  function isQuizDone(d) { return bcProgress[d] && bcProgress[d].quizScore !== undefined; }
  function isDayPassed(d) { return !!(bcProgress[d] && bcProgress[d].passed); }
  function allDaysPassed() { return BOOTCAMP_DAYS.every(day => isDayPassed(day.day)); }

  function dayCompletionPct(d) {
    const day = BOOTCAMP_DAYS[d - 1];
    const lessonsDone = day.lessons.filter((_, i) => isLessonDone(d, i)).length;
    const total = day.lessons.length + 1 + (day.writing ? 1 : 0);
    const done  = lessonsDone + (isQuizDone(d) ? 1 : 0) + ((bcProgress[d] && bcProgress[d].writingDone) ? 1 : 0);
    return Math.round((done / total) * 100);
  }

  function completeLesson(d, l) {
    const updated = { ...bcProgress, [d]: { ...(bcProgress[d] || {}), lessons: { ...(bcProgress[d]?.lessons || {}), [l]: true } } };
    saveBcProgress(updated);
  }

  function handleBcCheckAnswer(i, questions) {
    if (bcChosen !== null) return;
    setBcChosen(i);
    setBcAnswers(prev => [...prev, { chosen: i, correct: questions[bcQIdx].correct }]);
  }

  function handleBcNext(questions, onFinish) {
    if (bcQIdx + 1 < questions.length) { setBcQIdx(q => q + 1); setBcChosen(null); }
    else { setBcQIdx(0); setBcChosen(null); setBcAnswers([]); onFinish(); }
  }

  function finishCheck(d, l) {
    completeLesson(d, l);
    setBcView("day");
  }

  function finishDayQuiz(d, score, total) {
    const passed = score / total >= BC_PASS;
    const updated = { ...bcProgress, [d]: { ...(bcProgress[d] || {}), quizScore: score, quizTotal: total, passed } };
    saveBcProgress(updated);
    setBcView("quiz-result");
  }

  function renderContentBlock(block, idx) {
    if (block.t === "h")  return <div key={idx} style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 600, color: BURG, marginTop: 20, marginBottom: 6 }}>{block.v}</div>;
    if (block.t === "p")  return <div key={idx} style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.7, marginBottom: 10 }}>{block.v}</div>;
    if (block.t === "rule") return <div key={idx} style={{ background: "rgba(164,0,17,0.07)", border: "1px solid rgba(164,0,17,0.25)", borderLeft: "4px solid " + RED, borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}><div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, lineHeight: 1.6 }}>{block.v}</div></div>;
    if (block.t === "warn") return <div key={idx} style={{ background: "#fff3cd", border: "1px solid #e6a817", borderLeft: "4px solid #e6a817", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}><div style={{ fontFamily: F.sans, fontSize: 13, color: "#5c3d00", lineHeight: 1.6 }}>{block.v}</div></div>;
    if (block.t === "list") return <ul key={idx} style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>{block.items.map((it, j) => <li key={j} style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.7, marginBottom: 4 }}>{it}</li>)}</ul>;
    if (block.t === "kv")  return <div key={idx} style={{ marginBottom: 14 }}>{block.pairs.map(([k, v], j) => <div key={j} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0ebe5" }}><div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: BURG, minWidth: 130, flexShrink: 0 }}>{k}</div><div style={{ fontFamily: F.sans, fontSize: 13, color: "#333", lineHeight: 1.5, flex: 1 }}>{v}</div></div>)}</div>;
    if (block.t === "ex")  return <div key={idx} style={{ background: CREAM, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}><div style={{ padding: "10px 14px", background: "#f0e8e0", borderBottom: "1px solid #ddd" }}><span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Customer</span><div style={{ fontFamily: F.sans, fontSize: 13, color: "#333", marginTop: 4, lineHeight: 1.5 }}>{block.c}</div></div><div style={{ padding: "10px 14px" }}><span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1 }}>LUMÉ HAIR Response</span><div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, marginTop: 4, lineHeight: 1.5 }}>{block.a}</div></div></div>;
    if (block.t === "spot")      return <SpotBlock key={idx} {...block} />;
    if (block.t === "scorecard") return <ScorecardBlock key={idx} {...block} />;
    if (block.t === "flowchart") return <ResultsTreeBlock key={idx} />;
    if (block.t === "compare") return <div key={idx} style={{ marginBottom: 14 }}>{block.pairs.map(([bad, good], j) => <div key={j} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div style={{ background: "#fff0f0", border: "1px solid rgba(164,0,17,0.2)", borderRadius: 6, padding: "10px 12px" }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{"Do Not Say"}</div><div style={{ fontFamily: F.sans, fontSize: 12, color: "#666", lineHeight: 1.5 }}>{bad}</div></div><div style={{ background: "#f0fff0", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 6, padding: "10px 12px" }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Say Instead</div><div style={{ fontFamily: F.sans, fontSize: 12, color: "#2a4a2a", lineHeight: 1.5 }}>{good}</div></div></div>)}</div>;
    if (block.t === "video") return <div key={idx} style={{ marginBottom: 20 }}><div style={{ background: BURG, borderRadius: "10px 10px 0 0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 28, height: 28, background: RED, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: W }}>{"▶"}</div><div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: GOLD }}>{block.label}</div>{block.dur && <div style={{ fontFamily: F.sans, fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>{block.dur}</div>}</div>{block.url ? <video controls style={{ width: "100%", display: "block", borderRadius: "0 0 10px 10px", background: "#000", maxHeight: 340 }}><source src={block.url} type="video/mp4" /></video> : <div style={{ background: "#1a0005", borderRadius: "0 0 10px 10px", padding: "20px 14px", fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic", textAlign: "center" }}>{"Ask your team leader for the video link"}</div>}</div>;
    if (block.t === "tip") return <div key={idx} style={{ background: "linear-gradient(135deg,rgba(200,151,58,0.13),rgba(200,151,58,0.06))", border: "1px solid rgba(200,151,58,0.45)", borderLeft: "4px solid " + GOLD, borderRadius: 6, padding: "12px 14px", marginBottom: 14 }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{"Pro Tip"}</div><div style={{ fontFamily: F.sans, fontSize: 13, color: "#5a4000", lineHeight: 1.65 }}>{block.v}</div></div>;
    if (block.t === "summary") return <div key={idx} style={{ background: "linear-gradient(135deg,#f0ebe4,#e8ddd4)", border: "1px solid #c4b09a", borderRadius: 10, padding: "16px 18px", marginTop: 24, marginBottom: 4 }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: BURG, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>{"Key Takeaways"}</div><ul style={{ margin: 0, paddingLeft: 18 }}>{block.items.map((it, j) => <li key={j} style={{ fontFamily: F.sans, fontSize: 13, color: BURG, lineHeight: 1.7, marginBottom: 4 }}>{it}</li>)}</ul></div>;
    if (block.t === "scenario") {
      const isOpen = !!expandedScenarios[idx];
      return <div key={idx} style={{ border: "2px solid #e0d8d0", borderRadius: 10, overflow: "hidden", marginBottom: 16, background: W }}>
        <div style={{ background: "rgba(80,0,11,0.05)", padding: "10px 14px", borderBottom: "1px solid #ece5dc" }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{"Practice Scenario \u2014 Customer Message"}</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.65, fontStyle: "italic" }}>{"\u201c"}{block.customer}{"\u201d"}</div>
        </div>
        {block.hint && <div style={{ padding: "8px 14px", background: "rgba(200,151,58,0.07)", borderBottom: "1px solid rgba(200,151,58,0.2)" }}><div style={{ fontFamily: F.sans, fontSize: 12, color: "#7a5e10" }}>{"Hint: "}{block.hint}</div></div>}
        {!isOpen
          ? <button onClick={() => setExpandedScenarios(prev => ({ ...prev, [idx]: true }))} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "12px 14px", cursor: "pointer", fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: RED, textAlign: "left" }}>{"Show ideal response \u2192"}</button>
          : <div style={{ padding: "14px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{"Ideal Response"}</div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: "#1a4a1a", lineHeight: 1.7, background: "#f0fff4", border: "1px solid rgba(42,122,42,0.25)", borderRadius: 6, padding: "12px 14px" }}>{block.response}</div>
            </div>
        }
      </div>;
    }
    return null;
  }

  // ── GRADUATION ────────────────────────────────────────────────────────────
  if (bcView === "graduation") {
    const totalPts = BOOTCAMP_DAYS.reduce((sum, day) => sum + (bcProgress[day.day]?.quizScore || 0), 0);
    const totalPoss = BOOTCAMP_DAYS.reduce((sum, day) => sum + day.quiz.length, 0);
    return (
      <div style={{ minHeight: "100vh", background: HEADER_GRAD, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 48, marginBottom: 8 }}>{"🎓"}</div>
        <div style={{ fontFamily: F.serif, fontSize: 28, color: GOLD, fontWeight: 600, marginBottom: 8 }}>Training Complete</div>
        {playerName && <div style={{ fontFamily: F.serif, fontSize: 22, color: W, marginBottom: 6 }}>{playerName}</div>}
        <div style={{ fontFamily: F.sans, fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>has successfully completed the LUMÉ CX Agent Bootcamp</div>
        <div style={{ background: "rgba(200,151,58,0.15)", border: "2px solid " + GOLD, borderRadius: 12, padding: "20px 40px", marginBottom: 28 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Total Quiz Score</div>
          <div style={{ fontFamily: F.serif, fontSize: 40, color: GOLD, fontWeight: 700 }}>{totalPts} / {totalPoss}</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>{Math.round((totalPts / totalPoss) * 100)}{"% overall accuracy"}</div>
        </div>
        {BOOTCAMP_DAYS.map(day => (
          <div key={day.day} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: "#2a7a2a", fontWeight: 700 }}>{"✓"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Day {day.day}: {day.title}</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: GOLD }}>{bcProgress[day.day]?.quizScore || 0}/{day.quiz.length}</div>
          </div>
        ))}
        <div style={{ marginTop: 28, fontFamily: F.serif, fontSize: 16, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>You represent LUMÉ in every interaction.</div>
        <button onClick={() => setBcView("overview")} style={{ marginTop: 24, background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.7)", fontFamily: F.sans, fontSize: 13, padding: "10px 24px", borderRadius: 8, cursor: "pointer" }}>Back to Bootcamp</button>
      </div>
    );
  }

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  if (bcView === "overview") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>5-Day Program</div>
        <div style={{ fontFamily: F.serif, fontSize: 24, color: BURG, fontWeight: 600, marginBottom: 4 }}>CS Agent Bootcamp</div>
        <div style={{ fontFamily: F.sans, fontSize: 14, color: "#666", marginBottom: 24 }}>Complete each day in order. Pass the day quiz to unlock the next day. Minimum 75% to pass.</div>
        {allDaysPassed() && (
          <div style={{ background: "linear-gradient(135deg,#A40011,#50000B)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: F.serif, fontSize: 16, color: GOLD, fontWeight: 600 }}>All 5 Days Complete!</div><div style={{ fontFamily: F.sans, fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>View your graduation certificate</div></div>
            <button onClick={() => setBcView("graduation")} style={{ background: GOLD, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer" }}>Graduate</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {BOOTCAMP_DAYS.map(day => {
            const unlocked = isDayUnlocked(day.day);
            const pct = dayCompletionPct(day.day);
            const passed = isDayPassed(day.day);
            return (
              <div key={day.day} onClick={() => { if (!unlocked) return; setBcDay(day.day); setBcView("day"); }} style={{ background: W, border: "1px solid " + (passed ? "#2a7a2a" : unlocked ? "#ddd" : "#eee"), borderRadius: 12, padding: "18px 20px", cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.6, position: "relative", overflow: "hidden" }}>
                {passed && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: "#2a7a2a" }} />}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 11, color: unlocked ? RED : "#aaa", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>Day {day.day}</div>
                      {passed && <div style={{ fontFamily: F.sans, fontSize: 10, color: "#2a7a2a", fontWeight: 700, background: "#e8f5e8", padding: "2px 8px", borderRadius: 99 }}>COMPLETE</div>}
                      {!unlocked && <div style={{ fontFamily: F.sans, fontSize: 10, color: "#aaa", fontWeight: 700, background: "#f5f5f5", padding: "2px 8px", borderRadius: 99 }}>LOCKED</div>}
                    </div>
                    <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG, marginBottom: 2 }}>{day.title}</div>
                    <div style={{ fontFamily: F.sans, fontSize: 13, color: "#666", marginBottom: 8 }}>{day.subtitle}</div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#888" }}>{day.lessons.length} lessons</div>
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#888" }}>{day.duration}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {unlocked && <div style={{ fontFamily: F.serif, fontSize: 20, color: pct === 100 ? "#2a7a2a" : GOLD, fontWeight: 700 }}>{pct}{"%"}</div>}
                    {!unlocked && <div style={{ fontSize: 20 }}>{"🔒"}</div>}
                  </div>
                </div>
                {unlocked && pct > 0 && (
                  <div style={{ background: "#f0ebe5", borderRadius: 99, height: 4, marginTop: 12 }}>
                    <div style={{ background: passed ? "#2a7a2a" : GOLD, width: pct + "%", height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DAY VIEW ──────────────────────────────────────────────────────────────
  if (bcView === "day") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const quizAvail = allLessonsDone(bcDay);
    const writingAvail = day.writing && isQuizDone(bcDay);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("overview")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Bootcamp"}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>Day {bcDay}</div>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 4 }}>{day.title}</div>
        <div style={{ fontFamily: F.sans, fontSize: 14, color: "#666", marginBottom: 20 }}>{day.subtitle}</div>

        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>Lessons</div>
        {day.lessons.map((lesson, i) => {
          const done = isLessonDone(bcDay, i);
          return (
            <div key={lesson.id} onClick={() => { setBcLesson(i); setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("lesson"); }} style={{ background: W, border: "1px solid " + (done ? "#2a7a2a" : "#ddd"), borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 11, color: done ? "#2a7a2a" : RED, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>{"Lesson " + (i + 1)}</div>
                <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>{lesson.title}</div>
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 18, color: done ? "#2a7a2a" : "#ccc" }}>{done ? "✓" : "→"}</div>
            </div>
          );
        })}

        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Assessment</div>
        <div onClick={() => { if (!quizAvail) return; setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView(isQuizDone(bcDay) ? "quiz-result" : "quiz"); }} style={{ background: quizAvail ? W : "#f9f9f9", border: "1px solid " + (isQuizDone(bcDay) ? "#2a7a2a" : quizAvail ? "#ddd" : "#eee"), borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: quizAvail ? "pointer" : "not-allowed", opacity: quizAvail ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: isQuizDone(bcDay) ? "#2a7a2a" : quizAvail ? RED : "#aaa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Day {bcDay} Quiz</div>
            <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>{day.quiz.length} questions {"· "} 75% to pass</div>
            {isQuizDone(bcDay) && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#2a7a2a", marginTop: 2 }}>Score: {bcProgress[bcDay]?.quizScore}/{bcProgress[bcDay]?.quizTotal}</div>}
            {!quizAvail && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", marginTop: 2 }}>Complete all lessons to unlock</div>}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 18, color: isQuizDone(bcDay) ? "#2a7a2a" : quizAvail ? GOLD : "#ccc" }}>{isQuizDone(bcDay) ? "✓" : "→"}</div>
        </div>

        {day.writing && (
          <div onClick={() => { if (!writingAvail) return; setBcWriteInput(""); setBcWriteFeedback(""); setBcWriteDone(!!(bcProgress[bcDay]?.writingDone)); setBcView("writing"); }} style={{ background: writingAvail ? W : "#f9f9f9", border: "1px solid " + ((bcProgress[bcDay]?.writingDone) ? "#2a7a2a" : writingAvail ? "#ddd" : "#eee"), borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: writingAvail ? "pointer" : "not-allowed", opacity: writingAvail ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: (bcProgress[bcDay]?.writingDone) ? "#2a7a2a" : writingAvail ? GOLD : "#aaa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Writing Exercise</div>
              <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>AI-Graded Practice Response</div>
              {!writingAvail && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", marginTop: 2 }}>Complete the quiz to unlock</div>}
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 18, color: (bcProgress[bcDay]?.writingDone) ? "#2a7a2a" : writingAvail ? GOLD : "#ccc" }}>{(bcProgress[bcDay]?.writingDone) ? "✓" : "→"}</div>
          </div>
        )}
      </div>
    );
  }

  // ── LESSON VIEW ───────────────────────────────────────────────────────────
  if (bcView === "lesson") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const lesson = day.lessons[bcLesson];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("day")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Day " + bcDay}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>{"Day " + bcDay + " · Lesson " + (bcLesson + 1)}</div>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 20 }}>{lesson.title}</div>
        <div>{lesson.content.map((block, i) => renderContentBlock(block, i))}</div>
        <button onClick={() => { setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("check"); }} style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "14px 28px", border: "none", borderRadius: 8, cursor: "pointer", width: "100%", marginTop: 20 }}>Knowledge Check</button>
      </div>
    );
  }

  // ── LESSON CHECK ─────────────────────────────────────────────────────────
  if (bcView === "check") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const lesson = day.lessons[bcLesson];
    const questions = lesson.check;
    // Completion screen — triggered when on last Q and answered
    if (bcQIdx === questions.length - 1 && bcChosen !== null) {
      const allAnswers = bcAnswers;
      const finalCorrect = allAnswers.filter(a => a.chosen === a.correct).length;
      const perfect = finalCorrect === questions.length;
      const emoji = perfect ? "\uD83D\uDD25" : finalCorrect >= questions.length - 1 ? "\u2713" : "\uD83D\uDCAA";
      const headline = perfect ? "Perfect score!" : finalCorrect >= questions.length - 1 ? "Well done!" : "Keep going!";
      const nextLesson = day.lessons[bcLesson + 1];
      return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ textAlign: "center", padding: "28px 20px", background: perfect ? "linear-gradient(135deg,#e8f5e8,#f0fff4)" : "linear-gradient(135deg,#fff8e8,#fffff0)", border: "2px solid " + (perfect ? "#2a7a2a" : GOLD), borderRadius: 14, marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 700, color: perfect ? "#1a5a1a" : "#5a4000", marginBottom: 4 }}>{headline}</div>
            <div style={{ fontFamily: F.serif, fontSize: 40, fontWeight: 700, color: perfect ? "#2a7a2a" : GOLD }}>{finalCorrect} <span style={{ fontSize: 22, fontWeight: 400 }}>/ {questions.length}</span></div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: perfect ? "#2a7a2a" : "#5a4000", marginTop: 6 }}>{lesson.title}</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>{"Review"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {questions.map((qItem, qi) => {
              const ans = qi < questions.length - 1 ? bcAnswers[qi] : { chosen: bcChosen, correct: qItem.correct };
              const correct = ans && ans.chosen === ans.correct;
              return (
                <div key={qi} style={{ background: correct ? "#f0fff4" : "#fff8f0", border: "1px solid " + (correct ? "rgba(42,122,42,0.3)" : "rgba(200,151,58,0.4)"), borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ fontFamily: F.sans, fontSize: 14, color: correct ? "#2a7a2a" : GOLD, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{correct ? "\u2713" : "\u2715"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 13, color: "#333", fontWeight: 600, marginBottom: 4 }}>{qItem.q}</div>
                      {!correct && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#5a4000", lineHeight: 1.5 }}>{qItem.exp}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { completeLesson(bcDay, bcLesson); if (nextLesson) { setBcLesson(bcLesson + 1); setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("lesson"); } else { setBcView("day"); } }} style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "14px 28px", border: "none", borderRadius: 8, cursor: "pointer", width: "100%" }}>
              {nextLesson ? "Next Lesson: " + nextLesson.title + " \u2192" : "Back to Day " + bcDay + " \u2192"}
            </button>
            <button onClick={() => { completeLesson(bcDay, bcLesson); setBcView("day"); }} style={{ background: "none", border: "1px solid #ddd", color: "#666", fontFamily: F.sans, fontSize: 13, padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>{"Back to Day Overview"}</button>
          </div>
        </div>
      );
    }
    const q = questions[bcQIdx];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("lesson")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Lesson"}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>{"Knowledge Check " + (bcQIdx + 1) + " / " + questions.length}</div>
        <div style={{ background: "#f0ebe5", borderRadius: 99, height: 4, marginBottom: 20 }}><div style={{ background: RED, width: (((bcQIdx + 1) / questions.length) * 100) + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} /></div>
        <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = W, border = "1px solid #ddd", color = BURG;
            if (bcChosen !== null) {
              if (i === q.correct)  { bg = "#e8f5e8"; border = "2px solid #2a7a2a"; color = "#1a5a1a"; }
              else if (i === bcChosen) { bg = "#fde8e8"; border = "2px solid " + RED; color = RED; }
            }
            return <button key={i} onClick={() => handleBcCheckAnswer(i, questions)} style={{ background: bg, border, color, fontFamily: F.sans, fontSize: 14, padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: bcChosen !== null ? "default" : "pointer", lineHeight: 1.4 }}><span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i) + "."}</span>{opt}</button>;
          })}
        </div>
        {bcChosen !== null && (
          <div style={{ background: bcChosen === q.correct ? "#e8f5e8" : "#fff8e8", border: "1px solid " + (bcChosen === q.correct ? "#2a7a2a" : GOLD), borderRadius: 8, padding: 16, marginTop: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: bcChosen === q.correct ? "#2a7a2a" : GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{bcChosen === q.correct ? "Correct!" : "Not quite \u2014 here is why:"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#444", lineHeight: 1.6 }}>{q.exp}</div>
            <button onClick={() => handleBcNext(questions, () => {})} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 14 }}>
              {bcQIdx + 1 < questions.length ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DAY QUIZ ──────────────────────────────────────────────────────────────
  if (bcView === "quiz") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const questions = day.quiz;
    const q = questions[bcQIdx];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("day")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Day " + bcDay}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Day {bcDay} Quiz</div>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600, marginBottom: 4 }}>{day.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#f0ebe5", borderRadius: 99, height: 6, flex: 1 }}><div style={{ background: RED, width: (((bcQIdx + 1) / questions.length) * 100) + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} /></div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: "#888", flexShrink: 0 }}>{bcQIdx + 1} / {questions.length}</div>
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = W, border = "1px solid #ddd", color = BURG;
            if (bcChosen !== null) {
              if (i === q.correct)  { bg = "#e8f5e8"; border = "2px solid #2a7a2a"; color = "#1a5a1a"; }
              else if (i === bcChosen) { bg = "#fde8e8"; border = "2px solid " + RED; color = RED; }
            }
            return <button key={i} onClick={() => { if (bcChosen !== null) return; setBcChosen(i); setBcAnswers(prev => [...prev, { chosen: i, correct: q.correct }]); }} style={{ background: bg, border, color, fontFamily: F.sans, fontSize: 14, padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: bcChosen !== null ? "default" : "pointer", lineHeight: 1.4 }}><span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i) + "."}</span>{opt}</button>;
          })}
        </div>
        {bcChosen !== null && (
          <div style={{ background: bcChosen === q.correct ? "#e8f5e8" : "#fff8e8", border: "1px solid " + (bcChosen === q.correct ? "#2a7a2a" : GOLD), borderRadius: 8, padding: 16, marginTop: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: bcChosen === q.correct ? "#2a7a2a" : GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{bcChosen === q.correct ? "Correct!" : "Not quite"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 14 }}>{q.exp}</div>
            <button onClick={() => {
              if (bcQIdx + 1 < questions.length) { setBcQIdx(q2 => q2 + 1); setBcChosen(null); }
              else {
                const allAns = [...bcAnswers];
                const finalScore = allAns.filter(a => a.chosen === a.correct).length;
                finishDayQuiz(bcDay, finalScore, questions.length);
              }
            }} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer" }}>
              {bcQIdx + 1 < questions.length ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── QUIZ RESULT ───────────────────────────────────────────────────────────
  if (bcView === "quiz-result") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const prog = bcProgress[bcDay] || {};
    const score = prog.quizScore || 0;
    const total = prog.quizTotal || day.quiz.length;
    const passed = prog.passed;
    const pct = Math.round((score / total) * 100);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Day {bcDay} Results</div>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 20 }}>{day.title}</div>
        <div style={{ background: passed ? "#e8f5e8" : "#fff8e8", border: "2px solid " + (passed ? "#2a7a2a" : GOLD), borderRadius: 12, padding: "24px 32px", marginBottom: 24, display: "inline-block", minWidth: 200 }}>
          <div style={{ fontFamily: F.serif, fontSize: 48, color: passed ? "#2a7a2a" : GOLD, fontWeight: 700 }}>{pct}{"%"}</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: passed ? "#2a7a2a" : GOLD, fontWeight: 700, marginTop: 4 }}>{score} / {total} correct</div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: passed ? "#2a7a2a" : "#a07000", marginTop: 6 }}>{passed ? "Day " + bcDay + " Complete!" : "Need 75% to pass"}</div>
        </div>
        {passed && bcDay < 5 && <div style={{ fontFamily: F.sans, fontSize: 14, color: "#2a7a2a", marginBottom: 20 }}>Day {bcDay + 1} is now unlocked!</div>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {!passed && <button onClick={() => { setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("quiz"); }} style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Retry Quiz</button>}
          {passed && day.writing && !(bcProgress[bcDay]?.writingDone) && <button onClick={() => { setBcWriteInput(""); setBcWriteFeedback(""); setBcWriteDone(false); setBcView("writing"); }} style={{ background: GOLD, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Writing Exercise</button>}
          <button onClick={() => setBcView("day")} style={{ background: "transparent", border: "1px solid " + BURG, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 8, cursor: "pointer" }}>Back to Day</button>
          {passed && bcDay < 5 && <button onClick={() => { setBcDay(bcDay + 1); setBcView("day"); }} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Day {bcDay + 1}</button>}
          {passed && bcDay === 5 && allDaysPassed() && <button onClick={() => setBcView("graduation")} style={{ background: GOLD, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>{"🎓 Graduate"}</button>}
        </div>
      </div>
    );
  }

  // ── WRITING EXERCISE ─────────────────────────────────────────────────────
  if (bcView === "writing") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("day")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Day " + bcDay}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Writing Exercise</div>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600, marginBottom: 16 }}>AI-Graded Practice Response</div>
        <div style={{ background: "#f0e8e0", border: "1px solid #ddd", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Customer Message</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.6 }}>{day.writing.scenario}</div>
        </div>
        {!bcWriteDone ? (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#555", marginBottom: 10, lineHeight: 1.5 }}>Write your response in the LUMÉ voice. Apply the policies and tone you have learned. Claude will grade it.</div>
            <textarea
              value={bcWriteInput}
              onChange={e => setBcWriteInput(e.target.value)}
              placeholder="Write your response here..."
              rows={8}
              style={{ width: "100%", fontFamily: F.sans, fontSize: 14, padding: "12px 14px", border: "2px solid #ddd", borderRadius: 8, resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            <button onClick={submitWritingExercise} disabled={bcWriteLoading || !bcWriteInput.trim()} style={{ background: bcWriteLoading ? "#aaa" : RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "14px 28px", border: "none", borderRadius: 8, cursor: bcWriteLoading ? "not-allowed" : "pointer", width: "100%" }}>
              {bcWriteLoading ? "Grading" : "Submit for AI Grading"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Your Response</div>
            <div style={{ background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 8, padding: "12px 14px", marginBottom: 16, fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.6 }}>{bcWriteInput}</div>
            <div style={{ background: "rgba(200,151,58,0.08)", border: "2px solid " + GOLD, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Coach Feedback</div>
              <div style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{bcWriteFeedback}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setBcWriteInput(""); setBcWriteFeedback(""); setBcWriteDone(false); }} style={{ background: "transparent", border: "1px solid " + BURG, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "12px 20px", borderRadius: 8, cursor: "pointer", flex: 1 }}>Try Again</button>
              <button onClick={() => setBcView("day")} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "12px 20px", border: "none", borderRadius: 8, cursor: "pointer", flex: 1 }}>Back to Day {bcDay}</button>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}

// ─── INSIGHTS TAB ─────────────────────────────────────────────────────────────
// Local-date YYYY-MM-DD. toISOString() would shift to UTC and display
// "yesterday" for users east of UTC (AU sees May 8 when it's locally May 9).
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(name) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (name) {
    case "Today":      return { from: ymd(today), to: ymd(today) };
    case "Yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: ymd(y), to: ymd(y) }; }
    case "This week": { const w = new Date(today); w.setDate(w.getDate() - w.getDay()); return { from: ymd(w), to: ymd(today) }; }
    case "Last 7":    { const s = new Date(today); s.setDate(s.getDate() - 6); return { from: ymd(s), to: ymd(today) }; }
    case "Last 30":   { const s = new Date(today); s.setDate(s.getDate() - 29); return { from: ymd(s), to: ymd(today) }; }
    case "MTD":       { const m = new Date(today.getFullYear(), today.getMonth(), 1); return { from: ymd(m), to: ymd(today) }; }
    default:          return { from: ymd(today), to: ymd(today) };
  }
}

function formatDuration(seconds) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = seconds / 60;
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function formatMoney(value, currency = "USD") {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${Math.round(value * 100) / 100}`;
  }
}

// ─── Module D — Retention Cohorts (extends Insights) ─────────────────────────

function heatCellStyle(rate) {
  if (rate == null) return { background: "#F6F2EB", color: "#C8BFB2" };
  // 0.78 → 0.94 mapped onto a gold wash — deeper = better retention.
  const t = Math.max(0, Math.min(1, (rate - 0.78) / 0.16));
  const alpha = 0.10 + t * 0.55;
  return { background: `rgba(196,169,107,${alpha.toFixed(2)})`, color: t > 0.6 ? "#3A2F1B" : INK };
}

function RetentionSection() {
  const cohorts = retentionCohorts();
  const winback = winbackList();
  const S = SAVE_PLAY_OUTCOMES;

  function exportWinback() {
    const esc = (v) => /[",\n]/.test(String(v ?? "")) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? "");
    const header = ["Name", "Phone", "Country", "Hair profile", "Edit pairing", "Cancelled reason", "Would have renewed"].join(",");
    const body = winback.map((r) => [r.name, r.phone, r.country, r.hairProfile, r.pairing, r.cancelledReason, r.wouldRenew].map(esc).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUME_winback_outreach_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Win-back list exported — ready for outreach");
  }

  const th = { padding: "9px 12px", fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.2, textTransform: "uppercase", borderBottom: "1px solid " + SOFT_BORDER, background: CREAM, whiteSpace: "nowrap" };
  const td = { padding: "9px 12px", fontFamily: F.sans, fontSize: 12.5, borderBottom: "1px solid #F3EEE6", whiteSpace: "nowrap" };

  return (
    <>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, margin: "24px 0 8px" }}>Retention · 90-day cohorts</div>

      <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, overflow: "auto", marginBottom: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>Signup month</th>
              <th style={{ ...th, textAlign: "right" }}>Signups</th>
              <th style={{ ...th, textAlign: "right" }}>Active</th>
              <th style={{ ...th, textAlign: "right" }}>Paused</th>
              <th style={{ ...th, textAlign: "right" }}>Cancelled</th>
              <th style={{ ...th, textAlign: "center" }}>M1 renewal</th>
              <th style={{ ...th, textAlign: "center" }}>M2 renewal</th>
              <th style={{ ...th, textAlign: "center" }}>M3 renewal</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.month}>
                <td style={{ ...td, color: BURG, fontWeight: 700 }}>{c.month}</td>
                <td style={{ ...td, textAlign: "right" }}>{c.started.toLocaleString()}</td>
                <td style={{ ...td, textAlign: "right" }}>{c.active.toLocaleString()}</td>
                <td style={{ ...td, textAlign: "right", opacity: 0.7 }}>{c.paused.toLocaleString()}</td>
                <td style={{ ...td, textAlign: "right", opacity: 0.7 }}>{c.cancelled.toLocaleString()}</td>
                {["m1", "m2", "m3"].map((k) => (
                  <td key={k} style={{ ...td, textAlign: "center", fontWeight: 700, ...heatCellStyle(c[k]) }}>
                    {c[k] != null ? Math.round(c[k] * 100) + "%" : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
        <KpiTile label="Save intercepts" value={S.intercepts} hint="cancel flows entered" />
        <KpiTile label="Saved" value={`${S.saved} (${Math.round(S.saveRate * 100)}%)`} hint="of intercepts" trend={DEMO_TREND.saveRate} />
        <KpiTile label={S.bestPlay.label} value={`${Math.round(S.bestPlay.rate * 100)}%`} hint="save rate — best play" />
        <KpiTile label={S.secondPlay.label} value={`${Math.round(S.secondPlay.rate * 100)}%`} hint="save rate" />
        <KpiTile label="Skipped this month" value={SKIPPED_SUBS.count} hint={`top reason: ${SKIPPED_SUBS.topReason.toLowerCase()}`} />
      </div>

      <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 700, color: BURG }}>Win-back list — {winback.length} cancelled in range</div>
            <div style={{ fontFamily: F.sans, fontSize: 11.5, color: INK, opacity: 0.6, marginTop: 2 }}>Hair profile and Edit pairing come with each name — the outreach writes itself.</div>
          </div>
          <button onClick={exportWinback} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "9px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            Export for outreach
          </button>
        </div>
        <div style={{ overflow: "auto", maxHeight: 300 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                {["Name", "Phone", "Hair profile", "Edit pairing", "Reason", "Would renew"].map((h) => (
                  <th key={h} style={{ ...th, textAlign: "left", position: "sticky", top: 0, zIndex: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {winback.map((r) => (
                <tr key={r.name}>
                  <td style={{ ...td, color: BURG, fontWeight: 600 }}>{r.name}</td>
                  <td style={{ ...td, opacity: 0.75 }}>{r.phone}</td>
                  <td style={td}>{r.hairProfile}</td>
                  <td style={td}>{r.pairing}</td>
                  <td style={{ ...td, opacity: 0.75 }}>{r.cancelledReason}</td>
                  <td style={{ ...td, opacity: 0.75 }}>{new Date(r.wouldRenew + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function InsightsTab({ role }) {
  const canSeeRefunds = role && ["Lead Agent", "Manager", "Admin", "Owner"].includes(role);
  const initial = presetRange("Today");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [activePreset, setActivePreset] = useState("Today");
  // Instant render: every dataset starts pre-seeded with the bundled
  // demo data and refreshes silently — no loading pass, ever.
  const [data, setData] = useState(DEMO_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Trends state intentionally removed May 17 — see TrendsCard comment
  // below for re-enable instructions. Reports tab handles trends now.
  const [shop, setShop] = useState(DEMO_SHOPIFY);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [skio, setSkio] = useState(DEMO_SKIO);
  const [skioLoading, setSkioLoading] = useState(false);
  const [skioError, setSkioError] = useState(null);
  const [loop, setLoop] = useState(DEMO_LOOP);
  const [loopLoading, setLoopLoading] = useState(false);
  const [loopError, setLoopError] = useState(null);
  const [skioReasons, setSkioReasons] = useState(DEMO_SKIO_CANCEL_REASONS);
  const [skioReasonsError, setSkioReasonsError] = useState(null);

  async function load(rangeFrom = from, rangeTo = to) {
    setError(null);
    setShopError(null);
    setSkioError(null);
    setLoopError(null);
    setSkioReasonsError(null);

    // Anchor date ranges to AEST (UTC+10) — LUMÉ's Gorgias account
    // timezone, so the same date range in the Hub matches Gorgias's
    // dashboard regardless of where the viewer is sitting.
    const fromIso = new Date(rangeFrom + "T00:00:00+10:00").toISOString();
    const toIso = new Date(rangeTo + "T23:59:59+10:00").toISOString();

    // Fire integrations in parallel so one failing doesn't blank the rest.
    // Trends call removed May 17 — was the slow-LLM read of customer
    // messages. Reports tab still fetches it independently when opened.
    loadShop(fromIso, toIso);
    loadSkio(fromIso, toIso);
    loadSkioReasons(fromIso, toIso);
    if (canSeeRefunds) loadLoop(fromIso, toIso);

    try {
      const res = await fetch(`/api/insights/summary?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadShop(fromIso, toIso) {
    setShopError(null);
    try {
      const res = await fetch(`/api/insights/shopify?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setShop(json);
    } catch (e) {
      setShopError(e.message);
    } finally {
      setShopLoading(false);
    }
  }

  async function loadLoop(fromIso, toIso) {
    setLoopError(null);
    try {
      const res = await fetch(`/api/insights/loop?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setLoop(json);
    } catch (e) {
      setLoopError(e.message);
    } finally {
      setLoopLoading(false);
    }
  }

  async function loadSkio(fromIso, toIso) {
    setSkioError(null);
    try {
      const res = await fetch(`/api/insights/skio?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSkio(json);
    } catch (e) {
      setSkioError(e.message);
    } finally {
      setSkioLoading(false);
    }
  }

  // Skio cancel reasons live at a separate endpoint and feed the combined
  // RefundCancelReasonsPanel. Errors here just hide the cancel column —
  // the panel still renders refund data alone.
  async function loadSkioReasons(fromIso, toIso) {
    setSkioReasonsError(null);
    try {
      const res = await fetch(`/api/insights/skio/cancel-reasons?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSkioReasons(json);
    } catch (e) {
      setSkioReasonsError(e.message);
    }
  }

  // loadTrends removed May 17 — too slow for the day-to-day Insights tab
  // (reads a sample of customer messages and runs them through Claude).
  // The /api/insights/trends endpoint is still live and used by the
  // Weekly Reports tab via its own fetch path.

  useEffect(() => { load(); }, []);

  function applyPreset(name) {
    const r = presetRange(name);
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(name);
    load(r.from, r.to);
  }

  function onManualDateChange(setter) {
    return (e) => { setActivePreset(null); setter(e.target.value); };
  }

  const fmtPct = (n, total) => total ? `${Math.round((n / total) * 100)}%` : "0%";
  const sortEntries = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);

  const presets = ["Today", "Yesterday", "WTD", "MTD"];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 700, color: BURG }}>Insights</div>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.55, marginTop: 4, lineHeight: 1.5 }}>Live snapshot of tickets, orders, subscriptions and customer sentiment for the selected period.</div>
          {data?.fromCache && (
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginTop: 4 }}>cached</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input type="date" value={from} onChange={onManualDateChange(setFrom)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontFamily: F.sans, fontSize: 13 }} />
          <span style={{ color: "#999", fontFamily: F.sans, fontSize: 12 }}>to</span>
          <input type="date" value={to} onChange={onManualDateChange(setTo)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontFamily: F.sans, fontSize: 13 }} />
          <button onClick={() => load()} disabled={loading} style={{ background: BURG, color: W, border: "none", padding: "7px 16px", borderRadius: 6, fontFamily: F.sans, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1 }}>
            Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {presets.map((p) => (
          <button key={p} onClick={() => applyPreset(p)} style={{
            background: activePreset === p ? BURG : W,
            color: activePreset === p ? W : BURG,
            border: "1px solid " + (activePreset === p ? BURG : "#ddd"),
            padding: "5px 12px", borderRadius: 6, fontFamily: F.sans, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{p}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, marginBottom: 16, fontFamily: F.sans, fontSize: 13 }}>
          Gorgias: {error}
        </div>
      )}

      {data && (
        <>
          {/* Tiles trimmed to only the stats we can match Gorgias on
              cleanly. Resolution time and Messages/ticket use a different
              methodology (Gorgias filters to agent-replied tickets via a
              bulk lookup that's too slow to run inline) — pulled until we
              have a pre-warmed lookup. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <KpiTile label="Tickets" value={data.volume?.toLocaleString() ?? "—"} hint={data.volume != null ? `${data.volume.toLocaleString()} in range` : null} trend={DEMO_TREND.tickets} />
            <KpiTile label="CSAT" value={data.csat?.average != null ? data.csat.average.toFixed(2) : "—"} hint={data.csat?.count ? `${data.csat.count} responses` : "no responses"} trend={DEMO_TREND.csat} />
            <KpiTile label="Closed" value={(data.byStatus?.closed ?? 0).toLocaleString()} hint={fmtPct(data.byStatus?.closed ?? 0, data.volume)} trend={DEMO_TREND.closed} />
            <KpiTile label="Open" value={(data.byStatus?.open ?? 0).toLocaleString()} hint={fmtPct(data.byStatus?.open ?? 0, data.volume)} trend={DEMO_TREND.open} />
            <KpiTile
              label="Trustpilot"
              value={TRUSTPILOT_STATS.trustScore.toFixed(1)}
              hint={
                <a href={TRUSTPILOT_STATS.url} target="_blank" rel="noreferrer" style={{ color: BURG, textDecoration: "underline" }}>
                  {TRUSTPILOT_STATS.totalReviews.toLocaleString()} reviews ↗
                </a>
              }
            />
          </div>
        </>
      )}

      {/* CS TLDR / 3 trends to watch — removed from Insights May 17.
          The /api/insights/trends call reads a sample of customer messages
          and runs them through Claude, which made the tab feel slow.
          Trends still render in the Weekly Reports tab (uses TrendsBlock
          off a separately-fired fetch). To re-enable here: restore the
          trends state + loadTrends + the <TrendsCard> render below. */}

      {(shop || shopLoading || shopError) && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Shopify</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <KpiTile
              label="Orders"
              value={shop?.orders != null ? shop.orders.toLocaleString() : "—"}
              hint={shopError ? "error" : null}
              trend={DEMO_TREND.orders}
            />
            <KpiTile
              label="Refund rate ($)"
              value={
                shop?.refundRateDollars != null
                  ? `${(shop.refundRateDollars * 100).toFixed(2)}%`
                  : (shop?.refundRate != null ? `${(shop.refundRate * 100).toFixed(2)}%` : "—")
              }
              hint={(() => {
                const parts = [];
                if (shop?.refundRate != null) parts.push(`${(shop.refundRate * 100).toFixed(2)}% by count`);
                if (shop?.refunded != null) parts.push(`${shop.refunded.toLocaleString()} refunded (${shop.fullyRefunded ?? 0} full / ${shop.partiallyRefunded ?? 0} partial)`);
                return parts.length ? parts.join(" · ") : null;
              })()}
              trend={DEMO_TREND.refundRate}
            />
            <KpiTile
              label="Cancel rate"
              value={shop?.cancelRate != null ? `${(shop.cancelRate * 100).toFixed(2)}%` : "—"}
              hint={shop?.cancelled != null ? `${shop.cancelled.toLocaleString()} cancelled` : null}
              trend={DEMO_TREND.cancelRate}
            />
          </div>
          {shopError && (
            <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 16, fontFamily: F.sans, fontSize: 12 }}>
              Shopify: {shopError}
            </div>
          )}
        </>
      )}

      {canSeeRefunds && (loop || loopLoading || loopError) && (
        <LoopRefundsCard loop={loop} shop={shop} loading={loopLoading} error={loopError} />
      )}

      {canSeeRefunds && (loop?.topReasons ?? []).length > 0 && (
        <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 700, color: BURG, marginBottom: 12 }}>Refund reasons</div>
          <HBarList entries={loop.topReasons.map((r) => ({ key: r.reason, count: r.count }))} total={loop.count} labelWidth={220} />
        </div>
      )}

      {/* Combined exit signals — one place to see what's making customers
          ask for their money back OR cancel. Combines return reasons
          (with $) + Skio cancellation reasons. */}
      {(loop || skioReasons) && (
        <RefundCancelReasonsPanel
          loop={loop}
          skioReasons={skioReasons}
          shop={shop}
        />
      )}


      {(skio || skioLoading || skioError) && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Skio · Subscriptions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <KpiTile
              label="Active subs"
              value={skio?.active != null ? skio.active.toLocaleString() : "—"}
              hint={skio?.paused != null ? `${skio.paused.toLocaleString()} paused` : null}
              trend={DEMO_TREND.activeSubs}
            />
            <KpiTile
              label="Churn rate"
              value={skio?.churnRate != null ? `${(skio.churnRate * 100).toFixed(2)}%` : "—"}
              hint={skio?.activeAtStart != null ? `${skio.cancelled?.toLocaleString() ?? 0} of ${skio.activeAtStart.toLocaleString()} at start` : null}
              trend={DEMO_TREND.churnRate}
            />
            <KpiTile
              label="Cancellations"
              value={skio?.cancelled != null ? skio.cancelled.toLocaleString() : "—"}
              hint="in range"
              trend={DEMO_TREND.cancelledSubs}
            />
            <KpiTile
              label="New subs"
              value={skio?.created != null ? skio.created.toLocaleString() : "—"}
              hint={skio?.netChange != null ? `${skio.netChange >= 0 ? "+" : ""}${skio.netChange.toLocaleString()} net` : null}
              trend={DEMO_TREND.createdSubs}
            />
            <KpiTile
              label="Failed payments"
              value={skio?.failedPayments != null ? skio.failedPayments.toLocaleString() : "—"}
              hint="in range"
              trend={DEMO_TREND.failedPayments}
            />
          </div>
          {/* Skio "Top Cancel Reasons" removed — now consolidated with
              Loop refund reasons in the RefundCancelReasonsPanel above. */}
          {skioError && (
            <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 16, fontFamily: F.sans, fontSize: 12 }}>
              Skio: {skioError}
            </div>
          )}
        </>
      )}

      <RetentionSection />

      {data && (
        <>
          <BreakdownCard title="Tix by Channel" entries={sortEntries(data.byChannel)} total={data.volume} />
          <BreakdownCard title="Tix by Tags" entries={sortEntries(data.topTags)} total={data.volume} />
        </>
      )}
    </div>
  );
}

function LoopRefundsCard({ loop, shop, loading, error }) {
  const ROWS = [
    { key: "Monthly",    label: "Hair Edit subscribers (monthly)" },
    { key: "Bimonthly",  label: "Skip-month / bi-monthly" },
    { key: "Refills",    label: "Renewal orders" },
    { key: "OTP",        label: "One-time purchases" },
  ];
  const m = loop?.matrix ?? {};
  const directCount = shop?.refunded != null && loop?.count != null
    ? Math.max(0, shop.refunded - loop.count)
    : null;
  const directAmount = shop?.refundAmount != null && loop?.total != null
    ? Math.max(0, shop.refundAmount - loop.total)
    : null;
  const totalCount = shop?.refunded ?? loop?.count ?? 0;
  const totalAmount = shop?.refundAmount ?? loop?.total ?? 0;

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5 }}>Refunds</div>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>
            {formatMoney(totalAmount)}
            <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, fontWeight: 500, marginLeft: 10 }}>
              {loading ? "" : `· ${totalCount.toLocaleString()} cases`}
            </span>
          </div>
          {!loading && (loop?.count != null || directCount != null) && (
            <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 2 }}>
              {loop?.count ?? 0} customer-initiated ({formatMoney(loop?.total)}){directCount != null ? ` · ${directCount.toLocaleString()} direct in Shopify (${formatMoney(directAmount)})` : ""}
            </div>
          )}
          {/* When direct cases > 0 but direct $ is $0, the cases aren't
              actually refunds in the money-back sense — they're Shopify's
              internal refund-event records for payment-failure cancellations,
              store-credit refunds, or foreign-currency refunds where the USD
              value isn't directly available. Surface this so the number
              doesn't read as "6 real refunds for $0". */}
          {!loading && directCount != null && directCount > 0 && directAmount === 0 && (
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.55, marginTop: 6, maxWidth: 640, lineHeight: 1.4 }}>
              Some Shopify "refund" events recorded with $0 — typically orders cancelled due to payment failure, store-credit refunds, or foreign-currency refunds (where Shopify doesn't return a USD-normalised amount). Counted as cases but not added to the dollar total.
            </div>
          )}
        </div>
        {loop?.cutoff && (
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5 }}>
            Excludes pre-{new Date(loop.cutoff).toLocaleDateString("en-US", { month: "short", day: "numeric" })} stale returns data
          </div>
        )}
      </div>
      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, fontFamily: F.sans, fontSize: 12 }}>Returns: {error}</div>
      )}
      {!loading && !error && loop && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12 }}>
            <thead>
              <tr style={{ background: CREAM }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Cases</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Total $</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const cell = m[r.key] ?? { count: 0, amount: 0 };
                return (
                  <tr key={r.key} style={{ background: i % 2 === 0 ? W : "#fdfbf9" }}>
                    <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{cell.count}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(cell.amount)}</td>
                  </tr>
                );
              })}
              {directCount != null && (
                <tr style={{ background: "#fdfbf9" }}>
                  <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600, fontStyle: "italic" }}>Processed directly in Shopify</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{directCount}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(directAmount)}</td>
                </tr>
              )}
              {shop?.refunded != null && (
                <tr style={{ background: BURG, color: CREAM }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontSize: 11 }}>Total (all sources)</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{shop.refunded.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: GOLD }}>{formatMoney(totalAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Loop topReasons removed — now consolidated into the
              RefundCancelReasonsPanel below this card, which combines
              Loop refund reasons + Skio cancel reasons into one view. */}
        </div>
      )}
    </div>
  );
}

// LUMÉ refund/cancel reason categories. Order matters — first match wins.
// Covers the main reasons customers contact CX about their serum subscription.
const REASON_CATEGORIES = [
  {
    key: "wrong-serums",
    label: "Wrong serums / doesn't suit hair type",
    match: (s) => /wrong (serum|product|box|one)|received the wrong|got the wrong|incorrect (serum|product)|sent the wrong|not what i ordered|not right for my hair|doesn'?t suit|not suited/i.test(s),
  },
  {
    key: "shipping",
    label: "Delivery / shipping issue",
    match: (s) => /shipp|delivery|deliver|tracking|haven'?t (received|got)|not received|never (received|arrived|got)|arrived late|stuck in transit|lost in (transit|mail)|missing (package|order)/i.test(s),
  },
  {
    key: "adverse-reaction",
    label: "Adverse reaction / skin concern",
    match: (s) => /reaction|allerg|rash|itch|burn|sting|irritat|red|sensitive|hives|swelling|side effect|scalp (pain|burn)|made me (sick|unwell)/i.test(s),
  },
  {
    key: "have-enough",
    label: "Not using fast enough / have excess",
    match: (s) => /have (enough|too much)|already have|not using|not finishing|building up|stockpile|pause|skip|taking a break|too many|overstocked|not finished|accumulating/i.test(s),
  },
  {
    key: "no-results",
    label: "No results seen yet",
    match: (s) => /not working|doesn'?t work|no (results|improvement|change|difference)|isn'?t helping|didn'?t (work|help|notice|see)|not seeing|can'?t see/i.test(s),
  },
  {
    key: "price",
    label: "Price / too expensive",
    match: (s) => /expensive|price|cost|afford|cheaper|too much money|budget|financial|(can'?t|cannot) afford/i.test(s),
  },
  {
    key: "subscription-confusion",
    label: "Subscription confusion / unauthorized",
    match: (s) => /didn'?t (mean|want|know|realize|intend|authori[sz]e)|surprise|unaware|unauthori[sz]ed|accidental|by mistake|signed up by|never (agreed|signed)|charged without/i.test(s),
  },
  {
    key: "quality",
    label: "Damaged / quality issue",
    match: (s) => /damaged|broken|leak|pump|bottle|packaging|seal|tamper|defect|opened|crushed/i.test(s),
  },
  {
    key: "personal",
    label: "Personal / life change",
    match: (s) => /moving|personal|life change|situation|abroad|overseas|break|pause/i.test(s),
  },
  {
    key: "plain-cancel",
    label: "Plain cancel — no reason given",
    match: (s) => /^cancel|cancel my|cancel sub|stop sub|end sub|just cancel|please cancel/i.test(s),
  },
];

function bucketReason(reason) {
  const s = String(reason || "");
  for (const c of REASON_CATEGORIES) {
    if (c.match(s)) return c;
  }
  return { key: "other", label: "Other / unspecified" };
}

// Combined refund+cancel reasons panel. Pulls Loop's refund reasons (with
// per-reason $) and Skio's cancel-flow reasons, buckets free text into
// canonical LUMÉ categories, and shows one row per category sorted by $
// impact. The % of gross sales column is the actual lever for the
// $-based refund rate — so this panel doubles as a roadmap to which
// fix moves the headline number most.
function RefundCancelReasonsPanel({ loop, skioReasons, shop }) {
  const buckets = useMemo(() => {
    const map = new Map();
    const ensure = (key, label) => {
      if (!map.has(key)) {
        map.set(key, {
          key, label,
          refundCount: 0,
          refundAmount: 0,
          cancelCount: 0,
          examples: new Set(),
        });
      }
      return map.get(key);
    };

    for (const r of loop?.topReasons ?? []) {
      const cat = bucketReason(r.reason);
      const b = ensure(cat.key, cat.label);
      b.refundCount += r.count || 0;
      b.refundAmount += r.amount || 0;
      b.examples.add(r.reason);
    }
    for (const r of skioReasons?.topCancelReasons ?? []) {
      const cat = bucketReason(r.reason);
      const b = ensure(cat.key, cat.label);
      b.cancelCount += r.count || 0;
      b.examples.add(r.reason);
    }

    return [...map.values()].sort((a, b) => {
      // $ impact first (the lever for the headline rate). Tie-break by
      // total signal volume so cancel-only categories still rank.
      const dDelta = b.refundAmount - a.refundAmount;
      if (dDelta !== 0) return dDelta;
      return (b.refundCount + b.cancelCount) - (a.refundCount + a.cancelCount);
    });
  }, [loop, skioReasons]);

  if (buckets.length === 0) return null;

  const grossSales = shop?.grossSales ?? null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
        Refund & cancellation reasons
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginBottom: 10 }}>
        Combined exit signals — customer returns + Skio cancellations. Sorted by $ impact (the lever for the headline refund rate).
      </div>
      <div style={{ background: "#FFF", border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 13 }}>
          <thead>
            <tr style={{ background: CREAM, color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Category</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Refunds</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Cancels</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>$ refunded</th>
              {grossSales != null && (
                <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>% of gross</th>
              )}
            </tr>
          </thead>
          <tbody>
            {buckets.map((b, i) => {
              const pctGross = grossSales && grossSales > 0 ? (b.refundAmount / grossSales) * 100 : null;
              return (
                <tr key={b.key} style={{ borderTop: i > 0 ? "1px solid " + SOFT_BORDER : "none" }}>
                  <td style={{ padding: "10px 12px", color: INK, fontWeight: 600 }}>{b.label}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: b.refundCount > 0 ? BURG : "#bbb" }}>
                    {b.refundCount > 0 ? b.refundCount.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: b.cancelCount > 0 ? BURG : "#bbb" }}>
                    {b.cancelCount > 0 ? b.cancelCount.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: b.refundAmount > 0 ? GOLD : "#bbb", fontWeight: b.refundAmount > 0 ? 700 : 400 }}>
                    {b.refundAmount > 0 ? formatMoney(b.refundAmount) : "—"}
                  </td>
                  {grossSales != null && (
                    <td style={{ padding: "10px 12px", textAlign: "right", color: pctGross > 0 ? INK : "#bbb", fontWeight: pctGross > 0 ? 600 : 400 }}>
                      {pctGross > 0 ? `${pctGross.toFixed(2)}%` : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Manus-style CS TLDR. Header line shows ticket count + CSAT. Each trend
// renders title + estimated count/% + verbatim quote(s) + signal + action.
function TrendsCard({ trends, loading, error, gorgias }) {
  const items = trends?.trends ?? [];
  const csatAvg = gorgias?.csat?.average;
  const csatCount = gorgias?.csat?.count;
  const totalTickets = trends?.totalTickets ?? gorgias?.volume;
  return (
    <div style={{ background: "linear-gradient(160deg,#FFF 0%,#fbf6ef 100%)", border: "1px solid " + GOLD, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
        <span style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: BURG }}>CS TLDR</span>
        {totalTickets != null && (
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK }}>
            <strong style={{ color: BURG }}>{totalTickets.toLocaleString()}</strong> tickets
          </span>
        )}
        {csatAvg != null && (
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK }}>
            <span style={{ color: INK, opacity: 0.45 }}>·</span>{" "}
            CSAT <strong style={{ color: BURG }}>{csatAvg.toFixed(1)}/5</strong> ⭐
            {csatCount ? <span style={{ color: INK, opacity: 0.5, marginLeft: 6 }}>({csatCount})</span> : null}
          </span>
        )}
      </div>

      {loading && <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.5 }}>Reading customer messages…</div>}
      {error && <div style={{ fontFamily: F.sans, fontSize: 12, color: RED }}>{error}</div>}

      {!loading && !error && items.length > 0 && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 700, marginBottom: 10 }}>
            🚨 3 trends to watch:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((t, i) => <TrendItem key={i} index={i + 1} trend={t} />)}
          </div>
        </>
      )}

      {!loading && !error && items.length === 0 && (
        <span style={{ fontFamily: F.sans, fontSize: 12, color: "#888" }}>No trends found in this range.</span>
      )}

      {trends?.sampleSize ? (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginTop: 12 }}>
          {trends.readAll
            ? `Read every customer message: ${trends.sampleSize} of ${trends.totalTickets ?? "?"} tickets — counts are exact.`
            : `Read ${trends.sampleSize} customer messages of ${trends.totalTickets ?? "?"} total — counts are estimated from the sample.`}
        </div>
      ) : null}
    </div>
  );
}

function TrendItem({ index, trend }) {
  return (
    <div style={{ paddingLeft: 4 }}>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, fontWeight: 700, lineHeight: 1.4 }}>
        {index}. {trend.title}
        {trend.estTotal > 0 && (
          <span style={{ fontWeight: 500, color: INK, opacity: 0.7, marginLeft: 6 }}>
            — ~{trend.estTotal.toLocaleString()} tickets
            {trend.estPct > 0 ? ` (~${trend.estPct}% of volume)` : ""}
          </span>
        )}
      </div>
      {(trend.quotes ?? []).map((q, j) => {
        const tid = trend.quoteTicketIds?.[j];
        return (
          <div key={j} style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, lineHeight: 1.5, marginTop: 6, paddingLeft: 12, borderLeft: "2px solid " + GOLD }}>
            “{q}”
            {tid ? <GorgiasTicketLink id={tid} /> : null}
          </div>
        );
      })}
      {trend.signal && (
        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, lineHeight: 1.5, marginTop: 6 }}>
          <span style={{ color: BURG, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 10, marginRight: 6 }}>Signal</span>
          {trend.signal}
        </div>
      )}
      {trend.action && (
        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, lineHeight: 1.5, marginTop: 4 }}>
          <span style={{ color: BURG, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 10, marginRight: 6 }}>Action</span>
          {trend.action}
        </div>
      )}
    </div>
  );
}

// Inline link from a trend quote to its source ticket in Gorgias.
// Renders as a small "#1234 ↗" tag after the closing quote mark.
function GorgiasTicketLink({ id }) {
  const href = `https://lumebeauty.gorgias.com/app/ticket/${id}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        marginLeft: 6,
        fontFamily: F.sans,
        fontStyle: "normal",
        fontSize: 10,
        fontWeight: 600,
        color: BURG,
        textDecoration: "none",
        letterSpacing: 0.3,
        opacity: 0.8,
        whiteSpace: "nowrap",
      }}
      title="Open in Gorgias"
    >
      #{id} ↗
    </a>
  );
}

function KpiTile({ label, value, hint, trend }) {
  return (
    <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</div>
        {trend && <DeltaChip delta={trend.delta} good={trend.good} />}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 700, color: BURG, lineHeight: 1 }}>{value}</div>
        {trend && <Sparkline data={trend.series} width={72} height={24} />}
      </div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function BreakdownCard({ title, entries, total }) {
  if (!entries?.length) return null;
  const max = entries[0]?.[1] ?? 1;
  return (
    <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
      <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 700, color: BURG, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(([key, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0;
          const barWidth = Math.round((count / max) * 100);
          return (
            <div key={key} className="luma-bar-row" style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px", alignItems: "center", gap: 12 }}>
              <div className="luma-bar-label" style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", gridColumn: 1 }}>{key}</div>
              <div className="luma-bar-track" style={{ background: "#f0ebe5", borderRadius: 99, height: 8, position: "relative", overflow: "hidden", gridColumn: 2 }}>
                <div style={{ background: GOLD, width: barWidth + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <div className="luma-bar-value" style={{ fontFamily: F.sans, fontSize: 12, color: "#666", textAlign: "right", gridColumn: 3 }}>
                {count.toLocaleString()} <span style={{ color: "#aaa" }}>· {pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
