function normalizeUrl(raw) {
  if (!raw) return null;
  return raw.trim().replace(/\/+$/, "");
}

export function skioConfig() {
  const url = normalizeUrl(process.env.SKIO_API_URL) || "https://graphql.skio.com/v1/graphql";
  const token = process.env.SKIO_API_TOKEN;
  const siteId = process.env.SKIO_SITE_ID;
  return { url, token, siteId };
}

export async function skioGraphQL(query, variables = {}) {
  const { url, token } = skioConfig();
  if (!token) {
    throw new Error("Skio credentials missing: set SKIO_API_TOKEN");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `API ${token}`,
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
    const detail =
      typeof body === "object" && body !== null
        ? JSON.stringify(body)
        : body || res.statusText;
    throw new Error(`Skio ${res.status}: ${detail}`);
  }
  if (body?.errors) {
    throw new Error(`Skio GraphQL errors: ${JSON.stringify(body.errors)}`);
  }
  return body?.data ?? null;
}
