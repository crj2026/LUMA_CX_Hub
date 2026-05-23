import { auth, currentUser } from "@clerk/nextjs/server";
import { getRole, roleAtLeast } from "../../../../../lib/auth";
import { dbAvailable } from "../../../../../lib/db";
import { seedMacrosFromFile } from "../../../../../lib/kb-seed";

export const runtime = "nodejs";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Manager")) {
    return Response.json({ error: "Forbidden — Manager role required" }, { status: 403 });
  }
  if (!dbAvailable()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const result = await seedMacrosFromFile("macros-v2.md");
    return Response.json({ ok: true, ...result, runBy: role, at: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
