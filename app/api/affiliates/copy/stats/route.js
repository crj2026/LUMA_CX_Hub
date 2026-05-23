// Affiliate macro copy stats.
// GET → aggregated tally of Copy clicks over a configurable window.
// Manager+ only — the data drives Cherie's decision about which
// "not in Gorgias yet" macros to add next, so it's a management
// signal, not agent-facing.
//
// Query params:
//   ?days=30   (default 30, min 1, max 365)
//
// Returns:
//   {
//     days, since,
//     stats: [ { macroName, inGorgias, count }, ... ] sorted desc
//   }

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../../../../../lib/db";
import { getRole, roleAtLeast } from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  const role = getRole(user);
  if (!roleAtLeast(role, "Manager")) {
    return Response.json({ error: "Forbidden — Manager+ required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days") || 30);
  const days = Math.max(1, Math.min(365, Number.isFinite(daysParam) ? daysParam : 30));
  const since = new Date(Date.now() - days * 86400000);

  try {
    const grouped = await db.affiliateCopyEvent.groupBy({
      by: ["macroName", "inGorgias"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
    });

    const stats = grouped
      .map((g) => ({
        macroName: g.macroName,
        inGorgias: g.inGorgias,
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    const totalClicks = stats.reduce((sum, s) => sum + s.count, 0);

    return Response.json({
      days,
      since: since.toISOString(),
      totalClicks,
      stats,
    });
  } catch (err) {
    return Response.json({ error: err?.message ?? "Stats query failed" }, { status: 500 });
  }
}
