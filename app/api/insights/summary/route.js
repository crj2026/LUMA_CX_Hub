import { auth } from "@clerk/nextjs/server";
import { isCronRequest } from "../../../../lib/auth";
import {
  getTickets,
  getSurveys,
  filterIM8,
  tally,
  topNonBrandTags,
  csatStats,
  resolutionStats,
  mptStats,
} from "../../../../lib/insights";

export const runtime = "nodejs";

function parseRange(searchParams) {
  const to = searchParams.get("to") || new Date().toISOString();
  const from =
    searchParams.get("from") ||
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return { from, to };
}

export async function GET(req) {
  if (!isCronRequest(req)) {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const { from, to } = parseRange(searchParams);

  try {
    const [ticketResult, surveys] = await Promise.all([
      getTickets(from, to),
      getSurveys(from, to),
    ]);

    const allTickets = ticketResult.value.tickets;
    const im8Tickets = filterIM8(allTickets);
    const im8FromCache = ticketResult.fromCache;

    return Response.json({
      from,
      to,
      volume: im8Tickets.length,
      totalAcrossBrands: allTickets.length,
      pages: ticketResult.value.pages,
      truncated: ticketResult.value.truncated,
      csat: csatStats(surveys.value),
      resolution: resolutionStats(im8Tickets),
      mpt: mptStats(im8Tickets),
      byChannel: tally(im8Tickets, "channel"),
      byStatus: tally(im8Tickets, "status"),
      topTags: topNonBrandTags(im8Tickets, 5),
      fromCache: im8FromCache && surveys.fromCache,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
