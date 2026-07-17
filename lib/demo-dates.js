// Relative-date helpers for demo seed data.
//
// Every seeded record computes its createdAt relative to "now" so the
// demo is evergreen — no matter when the app is deployed or opened,
// "today" rows are always today and the last-7-days views always have
// data. Seed builders are FUNCTIONS (not constants) so server routes
// re-seed on every request and the client re-seeds on every page load.

export function hoursAgo(hours, minutes = 0) {
  return new Date(Date.now() - (hours * 60 + minutes) * 60 * 1000).toISOString();
}

export function daysAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// "YYYY-MM-DD" (local) — for date-only fields like marquee items and
// ship dates. Negative values give future dates.
export function dateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Canonical warehouse mapping — LUMÉ ships from three warehouses via
// Parcelline (3PL). Every customer country resolves to one of the three;
// there is no "Unspecified" bucket anywhere in the hub.
export const WAREHOUSES = ["AU — Sydney", "US — Los Angeles", "UK — London"];

export function warehouseFromCountry(country) {
  const c = String(country || "").toUpperCase().trim();
  if (["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA", "CA", "CAN", "CANADA", "MX", "MEXICO", "BR", "BRAZIL"].includes(c)) return "US — Los Angeles";
  if (["GB", "UK", "UNITED KINGDOM", "IE", "IRL", "IRELAND", "IM", "ISLE OF MAN", "FR", "FRANCE", "DE", "GERMANY", "ES", "SPAIN", "IT", "ITALY", "NL", "NETHERLANDS"].includes(c)) return "UK — London";
  // AU/NZ + APAC ship from Sydney — and Sydney is the home-market default.
  return "AU — Sydney";
}
