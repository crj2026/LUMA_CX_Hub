import { auth } from "@clerk/nextjs/server";
import { gorgiasFetch, gorgiasConfig } from "../../../../lib/gorgias";

export const runtime = "nodejs";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const which = searchParams.get("which") || "basic";

  const attempts = {
    basic: { path: "/api/tickets?limit=3", method: "GET" },
    customReports: { path: "/api/custom-reports", method: "GET" },
    customReportsList: { path: "/api/custom-reports?limit=3", method: "GET" },
    reportingEmpty: { path: "/api/reporting", method: "POST", body: {} },
    cubeMessages: {
      path: "/api/reporting",
      method: "POST",
      body: {
        metric_name: "support-performance-messages-sent-time-series",
        query: [
          {
            measures: ["HelpdeskMessageEnriched.messageCount"],
            dimensions: [],
            timeDimensions: [
              {
                dimension: "HelpdeskMessageEnriched.sentDatetime",
                dateRange: ["2026-04-28T00:00:00.000", "2026-05-04T23:59:59.000"],
                granularity: "day",
              },
            ],
            limit: 10000,
            timezone: "Asia/Hong_Kong",
            filters: [
              {
                member: "HelpdeskMessageEnriched.accountId",
                operator: "equals",
                values: ["124746"],
              },
              {
                member: "TicketEnriched.accountId",
                operator: "equals",
                values: ["124746"],
              },
              {
                member: "HelpdeskMessageEnriched.sentDatetime",
                operator: "inDateRange",
                values: ["2026-04-28T00:00:00.000", "2026-05-04T23:59:59.000"],
              },
              { member: "TicketEnriched.isTrashed", operator: "equals", values: ["0"] },
              { member: "TicketEnriched.isSpam", operator: "equals", values: ["0"] },
              {
                member: "HelpdeskMessageEnriched.isMessagePublic",
                operator: "equals",
                values: ["1"],
              },
              {
                member: "HelpdeskMessageEnriched.messageVia",
                operator: "in",
                values: ["aircall", "api", "helpdesk"],
              },
            ],
            rowLimit: 10000,
          },
        ],
      },
    },
    surveys: { path: "/api/satisfaction-surveys?limit=3", method: "GET" },
    teams: { path: "/api/teams", method: "GET" },
    users: { path: "/api/users?limit=3", method: "GET" },
  };

  const attempt = attempts[which] || attempts.basic;
  const url = `https://${gorgiasConfig().domain}${attempt.path}`;

  try {
    const init = { method: attempt.method };
    if (attempt.body !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(attempt.body);
    }
    const data = await gorgiasFetch(attempt.path, init);
    return Response.json({
      attempted: which,
      url,
      method: attempt.method,
      ok: true,
      sampleKeys: Array.isArray(data?.data) && data.data[0] ? Object.keys(data.data[0]) : null,
      topLevelKeys: data && typeof data === "object" ? Object.keys(data) : null,
      meta: data?.meta ?? null,
      preview: Array.isArray(data?.data) ? data.data.slice(0, 1) : data,
    });
  } catch (err) {
    return Response.json({
      attempted: which,
      url,
      method: attempt.method,
      ok: false,
      error: err.message,
    });
  }
}
