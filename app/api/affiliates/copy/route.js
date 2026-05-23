// Affiliate macro copy logger.
// POST → records one click on a hub Copy button (Affiliates tab).
//
// The body includes the macro name, which copy variant (name vs body),
// and whether the macro was in Gorgias at the time. Anyone signed in
// can log; only Manager+ can read aggregated stats via the sister
// /stats endpoint.
//
// Fire-and-forget from the client — never block the actual clipboard
// write on this call.

import { auth } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const macroName = String(body.macroName || "").trim();
  if (!macroName) {
    return Response.json({ error: "macroName required" }, { status: 400 });
  }

  // copyType is informational — we accept anything but only "name"
  // and "body" mean anything to the stats consumer today.
  const copyType = String(body.copyType || "unknown").trim().slice(0, 32);
  const inGorgias = !!body.inGorgias;

  try {
    await db.affiliateCopyEvent.create({
      data: { macroName, copyType, inGorgias, userId },
    });
    return Response.json({ ok: true });
  } catch (err) {
    // Don't surface the error to the client — the user already got
    // their text copied. Log server-side for visibility.
    console.error("[affiliate-copy] write failed:", err?.message ?? err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
