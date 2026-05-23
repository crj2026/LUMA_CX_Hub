import { gorgiasFetch, gorgiasConfig } from "./gorgias";

const DEFAULT_TZ = "Asia/Hong_Kong";

function accountId() {
  const id = process.env.GORGIAS_ACCOUNT_ID;
  if (!id) throw new Error("GORGIAS_ACCOUNT_ID is not set");
  return id;
}

function isoDay(d) {
  return new Date(d).toISOString().split(".")[0];
}

function ticketAccountFilters() {
  return [
    { member: "TicketEnriched.accountId", operator: "equals", values: [accountId()] },
    { member: "TicketEnriched.isTrashed", operator: "equals", values: ["0"] },
    { member: "TicketEnriched.isSpam", operator: "equals", values: ["0"] },
  ];
}

function messageAccountFilters() {
  return [
    { member: "HelpdeskMessageEnriched.accountId", operator: "equals", values: [accountId()] },
    { member: "HelpdeskMessageEnriched.isMessagePublic", operator: "equals", values: ["1"] },
    {
      member: "HelpdeskMessageEnriched.messageVia",
      operator: "in",
      values: ["aircall", "api", "helpdesk"],
    },
  ];
}

export async function cubeQuery(metricName, query) {
  const body = { metric_name: metricName, query: [query] };
  const res = await gorgiasFetch("/api/reporting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

export async function messagesByDay({ from, to, timezone = DEFAULT_TZ }) {
  const fromIso = isoDay(from);
  const toIso = isoDay(to);
  const query = {
    measures: ["HelpdeskMessageEnriched.messageCount"],
    dimensions: [],
    timeDimensions: [
      {
        dimension: "HelpdeskMessageEnriched.sentDatetime",
        dateRange: [fromIso, toIso],
        granularity: "day",
      },
    ],
    limit: 10000,
    timezone,
    filters: [
      ...messageAccountFilters(),
      ...ticketAccountFilters(),
      {
        member: "HelpdeskMessageEnriched.sentDatetime",
        operator: "inDateRange",
        values: [fromIso, toIso],
      },
    ],
    rowLimit: 10000,
  };
  const res = await cubeQuery("support-performance-messages-sent-time-series", query);
  return (res?.data ?? []).map((row) => ({
    day: row["HelpdeskMessageEnriched.sentDatetime"],
    count: Number(row["HelpdeskMessageEnriched.messageCount"]),
  }));
}

export async function ticketsByDay({ from, to, timezone = DEFAULT_TZ }) {
  const fromIso = isoDay(from);
  const toIso = isoDay(to);
  const query = {
    measures: ["TicketEnriched.ticketCount"],
    dimensions: [],
    timeDimensions: [
      {
        dimension: "TicketEnriched.createdDatetime",
        dateRange: [fromIso, toIso],
        granularity: "day",
      },
    ],
    limit: 10000,
    timezone,
    filters: [
      ...ticketAccountFilters(),
      {
        member: "TicketEnriched.createdDatetime",
        operator: "inDateRange",
        values: [fromIso, toIso],
      },
    ],
    rowLimit: 10000,
  };
  const res = await cubeQuery("support-performance-tickets-created-time-series", query);
  return (res?.data ?? []).map((row) => ({
    day: row["TicketEnriched.createdDatetime"],
    count: Number(row["TicketEnriched.ticketCount"]),
  }));
}
