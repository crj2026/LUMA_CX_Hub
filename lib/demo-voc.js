// Module C — Voice of Customer V2. A decision tool, not a feed: signals
// weighted by cost (cancellations > refunds > reviews > grumbles), the
// three actions worth taking with dollars attached, the wins, and the
// watchlist. Monthly view with a comparison month for the toggle.

export const VOC_WEIGHTING = "Weighted by cost: cancellations > refunds > reviews > grumbles.";

export const VOC_MONTHS = {
  current: {
    label: "This month",
    actions: [
      { title: "Add a tingling callout to the Scalp Serum PDP", signals: 89, impact: "$1,120 in refunds attributed", detail: "Customers surprised by the peppermint tingle refund at 3× the base rate. One line of PDP copy retires the biggest avoidable refund driver." },
      { title: "Send a week-3 “what to expect” email", signals: 67, impact: "13 “no results” refunds this month", detail: "The 3–4 week dip is predictable — customers who get timeline education at week 3 hold to the 4–6 week curve instead of refunding." },
      { title: "Lead save plays with a proactive Hair Edit swap", signals: 44, impact: "61% save rate on swap offers vs 43% baseline", detail: "When the save play opens with a curation fix rather than a discount, saves jump 18 points. Make the swap the default first move." },
    ],
    wins: [
      { title: "Save rate 43%", detail: "up 6 points on last month" },
      { title: "Trustpilot 4.6", detail: "across 1,355 reviews" },
      { title: "Same-day replacements", detail: "on 80% of cases" },
    ],
    watchlist: [
      { title: "Failed payments +18% MoM", detail: "dunning re-engagement is lagging — outreach campaign launches Monday" },
      { title: "“Not suitable for hair type” trending in the UK", detail: "curation mismatch cluster — likely quiz-localisation gap" },
      { title: "Instagram DMs +22%", detail: "channel shift toward social — staffing and macros need to follow" },
    ],
    summary: "The quarter's pattern is clear: nothing is broken, but two education gaps are quietly taxing us. Customers love the products once they see results — the ones we lose, we lose in week three or at first tingle, before the product has had its chance. The save motion is genuinely working, and the swap-first play is the best version of it. If we do one thing this month, it's the tingling callout on the Scalp Serum page — eleven hundred dollars a month in refunds for one sentence of copy.",
  },
  previous: {
    label: "Last month",
    actions: [
      { title: "Add a tingling callout to the Scalp Serum PDP", signals: 74, impact: "$960 in refunds attributed", detail: "Same driver as this month — trending up. The PDP copy fix has been the top action two months running." },
      { title: "Send a week-3 “what to expect” email", signals: 58, impact: "11 “no results” refunds", detail: "Timeline education continues to be the second-biggest lever." },
      { title: "Fix the swap-deadline reminder", signals: 39, impact: "31 missed-swap contacts", detail: "Customers missing the 12th cutoff generated a support spike mid-month; the in-portal reminder shipped on the 24th." },
    ],
    wins: [
      { title: "Save rate 37%", detail: "up 2 points" },
      { title: "Trustpilot 4.6", detail: "across 1,298 reviews" },
      { title: "Same-day replacements", detail: "on 74% of cases" },
    ],
    watchlist: [
      { title: "Failed payments +9% MoM", detail: "early signal — watch the dunning funnel" },
      { title: "Swap-deadline confusion", detail: "resolved late in the month by the portal reminder" },
      { title: "Instagram DMs +15%", detail: "social volume building" },
    ],
    summary: "A steady month with one operational miss: the swap-deadline confusion cost us a mid-month support spike before the portal reminder shipped. The underlying story is unchanged — tingling surprise and week-three impatience are the two levers, and both are education fixes, not product fixes. The tingling PDP callout remains the single biggest thing we can do.",
  },
};
