// Linear hierarchy used by roleAtLeast. "Ops" is intentionally placed
// between Agent and Lead Agent — they can do Agent-level write actions
// but stop short of Lead Agent's read-all permissions for CS log tables.
// Ops gets explicit allowances on the order-request endpoints via the
// canEditOpsRequest helper below; for everything else the hub shows them
// a stripped-down view (only Logs → Ops Requests).
export const ROLES = ["New Starter", "Agent", "Ops", "Lead Agent", "Manager", "Admin", "Owner"];

export function isOps(role) {
  return role === "Ops";
}

export function canEditOpsRequest(role) {
  return role === "Ops" || roleAtLeast(role, "Lead Agent");
}

// Bypass marker for the scheduled cache warmer — checked in route handlers
// to skip Clerk auth + role gating for internal cron-driven traffic.
export function isCronRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

const OWNER_EMAILS = ["cherie.jones@prenetics.com"];

// Testing-open-access flag — historically auto-promoted every signed-in
// user to "Manager" so the team could explore all tabs during early
// rollout. Now OFF: real roles are managed via the Team tab and stored
// in Clerk publicMetadata. New sign-ups get "New Starter" by default
// until an Admin assigns them a real role.
const TESTING_OPEN_ACCESS = false;

export function getRole(user) {
  if (!user) return null;
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    null;
  if (email && OWNER_EMAILS.includes(email.toLowerCase())) return "Owner";
  if (TESTING_OPEN_ACCESS) return "Manager";
  const stored = user.publicMetadata?.role;
  if (stored && ROLES.includes(stored)) return stored;
  return "New Starter";
}

export function roleAtLeast(role, minimum) {
  return ROLES.indexOf(role) >= ROLES.indexOf(minimum);
}

export function getDisplayName(user) {
  if (!user) return "";
  if (user.firstName) return user.firstName;
  return (
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    user.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    "there"
  );
}
