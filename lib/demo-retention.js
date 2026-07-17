// Module D — Retention Cohorts. 90-day renewal cohorts for the last six
// signup months, save-play outcomes, skipped subs, and the win-back list
// (cancelled subscribers with phone numbers, ready for outreach export).
// Month labels and renewal dates are relative so the view is evergreen.

function monthLabel(monthsAgo) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
}

function daysFromNowISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Last 6 signup months, oldest first. Renewal decays ~92% M1 → ~81% M3.
export function retentionCohorts() {
  const rows = [
    { started: 612, active: 448, paused: 52, cancelled: 112, m1: 0.91, m2: 0.85, m3: 0.80 },
    { started: 655, active: 492, paused: 55, cancelled: 108, m1: 0.92, m2: 0.86, m3: 0.81 },
    { started: 689, active: 528, paused: 58, cancelled: 103, m1: 0.92, m2: 0.87, m3: 0.82 },
    { started: 714, active: 566, paused: 61, cancelled: 87,  m1: 0.93, m2: 0.87, m3: null },
    { started: 742, active: 618, paused: 57, cancelled: 67,  m1: 0.93, m2: null, m3: null },
    { started: 781, active: 704, paused: 44, cancelled: 33,  m1: null, m2: null, m3: null },
  ];
  return rows.map((r, i) => ({ ...r, month: monthLabel(5 - i) }));
}

export const SAVE_PLAY_OUTCOMES = {
  intercepts: 148,
  saved: 64,
  saveRate: 0.43,
  bestPlay: { label: "Formula swap", rate: 0.61 },
  secondPlay: { label: "Pause instead", rate: 0.34 },
};

export const SKIPPED_SUBS = {
  count: 71,
  topReason: "Too much product left",
  detail: "Skips are a save signal, not churn — most skippers renew the following month.",
};

// Cancelled-in-range subscribers for win-back outreach. Hair profile and
// Edit pairing come from the quiz; renewal date is what their next
// renewal would have been.
export function winbackList() {
  return [
    { name: "Chloe Fitzpatrick", phone: "+61 412 384 291", country: "AU", hairProfile: "Fine, straight",        pairing: "Smooth + Glow",  cancelledReason: "Too expensive",          wouldRenew: daysFromNowISO(4) },
    { name: "James Okafor",      phone: "+1 (310) 555-0142", country: "US", hairProfile: "Coily, high porosity", pairing: "Repair + Scalp", cancelledReason: "No results seen yet",     wouldRenew: daysFromNowISO(7) },
    { name: "Sophie Brennan",    phone: "+44 7700 900318",  country: "GB", hairProfile: "Wavy, colour-treated", pairing: "Repair + Glow",  cancelledReason: "Wrong serums",            wouldRenew: daysFromNowISO(9) },
    { name: "Marcus Webb",       phone: "+61 401 552 876",  country: "AU", hairProfile: "Thinning, sensitive scalp", pairing: "Scalp + Smooth", cancelledReason: "Adverse reaction",   wouldRenew: daysFromNowISO(12) },
    { name: "Priya Nair",        phone: "+61 423 118 447",  country: "AU", hairProfile: "Thick, curly",         pairing: "Repair + Glow",  cancelledReason: "Not using fast enough",   wouldRenew: daysFromNowISO(6) },
    { name: "Georgia Whitfield", phone: "+61 438 209 663",  country: "AU", hairProfile: "Bleached, damaged",    pairing: "Repair + Scalp", cancelledReason: "Personal / life change",  wouldRenew: daysFromNowISO(15) },
    { name: "Liam O'Brien",      phone: "+44 7700 900541",  country: "GB", hairProfile: "Straight, oily scalp", pairing: "Scalp + Glow",   cancelledReason: "Too expensive",           wouldRenew: daysFromNowISO(11) },
    { name: "Fatima Al-Hassan",  phone: "+1 (415) 555-0187", country: "US", hairProfile: "Curly, dry ends",     pairing: "Repair + Glow",  cancelledReason: "Switching products",      wouldRenew: daysFromNowISO(18) },
    { name: "Zoe Andersen",      phone: "+61 447 903 215",  country: "AU", hairProfile: "Fine, flat roots",     pairing: "Smooth + Scalp", cancelledReason: "Too expensive",           wouldRenew: daysFromNowISO(21) },
    { name: "Aria Thompson",     phone: "+61 419 664 032",  country: "AU", hairProfile: "Wavy, frizz-prone",    pairing: "Smooth + Glow",  cancelledReason: "No results seen yet",     wouldRenew: daysFromNowISO(5) },
    { name: "Cooper Reid",       phone: "+1 (206) 555-0129", country: "US", hairProfile: "Short, low maintenance", pairing: "Scalp + Smooth", cancelledReason: "Not using fast enough", wouldRenew: daysFromNowISO(8) },
    { name: "Delilah Moss",      phone: "+44 7700 900274",  country: "GB", hairProfile: "Coily, protective styles", pairing: "Repair + Scalp", cancelledReason: "Too expensive",       wouldRenew: daysFromNowISO(14) },
    { name: "Elsie Grant",       phone: "+61 402 771 508",  country: "AU", hairProfile: "Grey blend, dry",      pairing: "Repair + Glow",  cancelledReason: "Changed mind",            wouldRenew: daysFromNowISO(10) },
    { name: "Finn Maguire",      phone: "+44 7700 900462",  country: "GB", hairProfile: "Thick, unruly",        pairing: "Smooth + Repair", cancelledReason: "Too expensive",          wouldRenew: daysFromNowISO(17) },
    { name: "Hazel Winters",     phone: "+1 (512) 555-0166", country: "US", hairProfile: "Fine, colour-treated", pairing: "Repair + Smooth", cancelledReason: "Wrong serums",          wouldRenew: daysFromNowISO(13) },
    { name: "Imogen Clarke",     phone: "+61 431 226 984",  country: "AU", hairProfile: "Wavy, oily roots",     pairing: "Scalp + Glow",   cancelledReason: "Personal / life change",  wouldRenew: daysFromNowISO(24) },
    { name: "Kai Nakamura",      phone: "+1 (808) 555-0135", country: "US", hairProfile: "Straight, thick",     pairing: "Smooth + Glow",  cancelledReason: "Switching products",      wouldRenew: daysFromNowISO(19) },
    { name: "Lara Beaumont",     phone: "+44 7700 900389",  country: "GB", hairProfile: "Curly, high shrinkage", pairing: "Repair + Scalp", cancelledReason: "No results seen yet",    wouldRenew: daysFromNowISO(16) },
    { name: "Milo Jensen",       phone: "+61 455 810 377",  country: "AU", hairProfile: "Medium, flaky scalp",  pairing: "Scalp + Smooth", cancelledReason: "Too expensive",           wouldRenew: daysFromNowISO(22) },
    { name: "Sienna Marsh",      phone: "+61 468 042 519",  country: "AU", hairProfile: "Long, heat-styled",    pairing: "Repair + Glow",  cancelledReason: "Not using fast enough",   wouldRenew: daysFromNowISO(26) },
  ];
}
