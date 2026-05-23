// Team management — list users + send invites.
// GET  → list all current users + pending invitations
// POST → create a Clerk invitation (sends magic-link email)
//
// Access: Admin + Owner only (enforced by requireAdmin below).
// Permission nuances:
//   - Owner can assign any role except Owner (which is hardcoded by email in lib/auth)
//   - Admin can assign roles up to Manager (NOT Admin or Owner)
//   - No one can assign "Owner" via this API — it's email-based for safety

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getRole, ROLES } from "../../../../lib/auth";

export const runtime = "nodejs";

const OWNER_EMAIL = "cherie.jones@prenetics.com";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await currentUser();
  const role = getRole(user);
  if (role !== "Admin" && role !== "Owner") {
    return { error: Response.json({ error: "Forbidden — Admin or Owner role required" }, { status: 403 }) };
  }
  return { user, role };
}

function effectiveRole(u) {
  const email = u.primaryEmailAddress?.emailAddress?.toLowerCase() ??
                u.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;
  if (email === OWNER_EMAIL) return "Owner";
  return u.publicMetadata?.role ?? "New Starter";
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const clerk = await clerkClient();

    // Pull all users — for an IM8 CS team this is small (<100). If we
    // outgrow the limit we'll paginate, but no point complicating V1.
    const usersRes = await clerk.users.getUserList({ limit: 100, orderBy: "-created_at" });
    const users = (usersRes.data ?? usersRes).map((u) => ({
      id: u.id,
      email: u.primaryEmailAddress?.emailAddress ?? u.emailAddresses?.[0]?.emailAddress ?? null,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.publicMetadata?.role ?? null,
      effectiveRole: effectiveRole(u),
      lastSignInAt: u.lastSignInAt,
      createdAt: u.createdAt,
      imageUrl: u.imageUrl,
    }));

    // Pending invitations — people who've been invited but haven't accepted yet
    let pending = [];
    try {
      const invRes = await clerk.invitations.getInvitationList({ status: "pending", limit: 100 });
      pending = (invRes.data ?? invRes).map((inv) => ({
        id: inv.id,
        email: inv.emailAddress,
        role: inv.publicMetadata?.role ?? null,
        createdAt: inv.createdAt,
      }));
    } catch (e) {
      // Some Clerk SDK versions need different signatures — degrade gracefully
      console.error("[users] pending invites lookup failed:", e.message);
    }

    return Response.json({ users, pendingInvites: pending, viewerRole: guard.role });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "").trim();

  if (!email) return Response.json({ error: "email required" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email format" }, { status: 400 });
  }
  if (!ROLES.includes(role)) {
    return Response.json({ error: `role must be one of: ${ROLES.join(", ")}` }, { status: 400 });
  }

  // Permission rules — defense in depth (UI also gates these)
  if (role === "Owner") {
    return Response.json({ error: "Owner role is set by email, not assignable via invite" }, { status: 400 });
  }
  if (role === "Admin" && guard.role !== "Owner") {
    return Response.json({ error: "Only Owner can grant Admin role" }, { status: 403 });
  }

  try {
    const clerk = await clerkClient();
    const origin = req.headers.get("origin") || "https://im8-cs-hub-production.up.railway.app";
    const inv = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role },
      redirectUrl: origin,
    });
    return Response.json({
      invitation: { id: inv.id, email: inv.emailAddress, role, createdAt: inv.createdAt },
    }, { status: 201 });
  } catch (err) {
    // Clerk's SDK throws errors with a richer `errors` array than the
    // bare `message`. Surface the most informative bit so the user
    // doesn't just see "Bad Request" with no clue what to do.
    // err.errors is typically:
    //   [{ code, message, long_message, meta: { param_name, ... } }]
    let userMessage = err?.message || "Invitation failed";
    let code = null;
    if (Array.isArray(err?.errors) && err.errors.length > 0) {
      const e0 = err.errors[0];
      code = e0?.code || null;
      userMessage = e0?.long_message || e0?.message || userMessage;
    }
    // Friendly translations for the common Clerk error codes.
    if (code === "duplicate_record" || code === "form_identifier_exists") {
      userMessage = "That email already has an account or pending invite — check the Users tab and pending invitations.";
    } else if (code === "form_param_format_invalid") {
      userMessage = "Clerk rejected the input — " + userMessage;
    } else if (code === "redirect_url_invalid") {
      userMessage = "The invite redirect URL isn't on Clerk's allowed list. Add the hub's URL in Clerk dashboard → Configure → Paths → Redirect URLs.";
    }
    // Log the full error server-side for diagnosis
    console.error("[admin/users POST] Clerk invite failed:", {
      code,
      message: err?.message,
      errors: err?.errors,
      status: err?.status,
    });
    return Response.json({
      error: userMessage,
      clerkCode: code,
    }, { status: err?.status === 422 ? 409 : 500 });
  }
}
