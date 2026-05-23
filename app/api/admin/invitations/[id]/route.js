// Revoke a pending Clerk invitation.
// DELETE → revokes the invite so the magic link in the email stops working.
// Access: Admin + Owner only.

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getRole } from "../../../../../lib/auth";

export const runtime = "nodejs";

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

export async function DELETE(_req, { params }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing invitation id" }, { status: 400 });

  try {
    const clerk = await clerkClient();
    await clerk.invitations.revokeInvitation(id);
    return Response.json({ ok: true });
  } catch (err) {
    if (err.status === 404) return Response.json({ error: "Invitation not found" }, { status: 404 });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
