export const ROLES = ["New Starter", "Agent", "Ops", "Lead Agent", "Manager", "Admin", "Owner"];

export function isOps(role) {
  return role === "Ops";
}

export function canEditOpsRequest(role) {
  return role === "Ops" || roleAtLeast(role, "Lead Agent");
}

export function isCronRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("x-cron-secret") === secret;
}

const OWNER_EMAILS = [
  process.env.OWNER_EMAIL,
  "cherie.jones@prenetics.com",
].filter(Boolean);

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
