// Team management — modify or remove an existing user.
// PATCH  → change role
// DELETE → remove access (hard delete from Clerk)
//
// Access: Admin + Owner only.
// Permission nuances enforced here:
//   - Admins can't modify other Admins or the Owner
//   - Owner-by-email (cherie.jones@prenetics.com) cannot be modified or deleted
//   - Only Owner can promote someone to Admin
//   - No one can be assigned the "Owner" role via API (it's email-based)

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getRole, ROLES } from "../../../../../lib/auth";

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
  return { user, role, userId };
}

function targetEmail(u) {
  return (
    u.primaryEmailAddress?.emailAddress?.toLowerCase() ??
    u.emailAddresses?.[0]?.emailAddress?.toLowerCase() ??
    null
  );
}

export async function PATCH(req, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing user id" }, { status: 400 });

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const role = String(body.role || "").trim();
  if (!ROLES.includes(role)) {
    return Response.json({ error: `role must be one of: ${ROLES.join(", ")}` }, { status: 400 });
  }
  if (role === "Owner") {
    return Response.json({ error: "Owner role is set by email, not assignable" }, { status: 400 });
  }
  if (role === "Admin" && guard.role !== "Owner") {
    return Response.json({ error: "Only Owner can grant Admin role" }, { status: 403 });
  }

  try {
    const clerk = await clerkClient();
    const target = await clerk.users.getUser(id);
    const currentTargetRole = target.publicMetadata?.role;
    const tEmail = targetEmail(target);

    // Hardcoded Owner protection — Cherie's role is always Owner-by-email
    // regardless of metadata. Block any attempt to change her metadata role.
    if (tEmail === OWNER_EMAIL) {
      return Response.json({ error: "Owner role is protected — cannot be modified" }, { status: 403 });
    }

    // Admins can't modify other Admins or the Owner
    if (guard.role === "Admin" && (currentTargetRole === "Admin" || currentTargetRole === "Owner")) {
      return Response.json({ error: "Admins can't modify other Admins or the Owner" }, { status: 403 });
    }

    // No one can demote themselves from Admin (must be done by Owner)
    if (id === guard.userId && currentTargetRole === "Admin" && role !== "Admin") {
      return Response.json({ error: "You can't demote yourself — ask another Admin/Owner" }, { status: 403 });
    }

    await clerk.users.updateUserMetadata(id, {
      publicMetadata: { ...target.publicMetadata, role },
    });

    return Response.json({ ok: true, userId: id, role });
  } catch (err) {
    if (err.status === 404) return Response.json({ error: "User not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing user id" }, { status: 400 });

  if (id === guard.userId) {
    return Response.json({ error: "You can't remove yourself" }, { status: 403 });
  }

  try {
    const clerk = await clerkClient();
    const target = await clerk.users.getUser(id);
    const currentTargetRole = target.publicMetadata?.role;
    const tEmail = targetEmail(target);

    if (tEmail === OWNER_EMAIL) {
      return Response.json({ error: "Owner cannot be removed" }, { status: 403 });
    }
    if (guard.role === "Admin" && (currentTargetRole === "Admin" || currentTargetRole === "Owner")) {
      return Response.json({ error: "Admins can't remove other Admins or the Owner" }, { status: 403 });
    }

    await clerk.users.deleteUser(id);
    return Response.json({ ok: true });
  } catch (err) {
    if (err.status === 404) return Response.json({ error: "User not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
