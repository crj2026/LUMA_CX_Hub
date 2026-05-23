function normalizeStore(raw) {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/\/+$/, "");
  return s;
}

export function shopifyConfig() {
  const store = normalizeStore(process.env.SHOPIFY_STORE_URL);
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || "2024-04";
  return { store, token, version };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function shopifyFetch(path, init = {}) {
  const { store, token, version } = shopifyConfig();
  if (!store || !token) {
    throw new Error("Shopify credentials missing: set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN");
  }
  const url = path.startsWith("http")
    ? path
    : `https://${store}/admin/api/${version}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = {
    Accept: "application/json",
    "X-Shopify-Access-Token": token,
    ...(init.headers || {}),
  };

  const MAX_ATTEMPTS = 6;
  let attempt = 0;
  while (true) {
    attempt++;
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      const retryAfter = Number(res.headers.get("retry-after")) || attempt;
      await sleep(Math.min(retryAfter * 1000, 8000));
      continue;
    }

    if (!res.ok) {
      const message =
        (body && body.errors && (typeof body.errors === "string" ? body.errors : JSON.stringify(body.errors))) ||
        res.statusText ||
        `HTTP ${res.status}`;
      throw new Error(`Shopify ${res.status}: ${message}`);
    }

    return { body, linkHeader: res.headers.get("link") };
  }
}

export function parseNextPageInfo(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  if (!match) return null;
  const url = new URL(match[1]);
  return url.searchParams.get("page_info");
}

export async function shopifyGraphQL(query, variables = {}) {
  const { store, token, version } = shopifyConfig();
  if (!store || !token) {
    throw new Error("Shopify credentials missing");
  }
  const url = `https://${store}/admin/api/${version}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`Shopify GraphQL ${res.status}: ${body?.errors ? JSON.stringify(body.errors) : res.statusText}`);
  }
  if (body?.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(body.errors)}`);
  }
  return body?.data ?? null;
}
