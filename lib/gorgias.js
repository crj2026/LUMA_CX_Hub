const DEFAULT_DOMAIN = "prenetics.gorgias.com";

function basicAuthHeader(username, apiKey) {
  const token = Buffer.from(`${username}:${apiKey}`).toString("base64");
  return `Basic ${token}`;
}

export function gorgiasConfig() {
  const domain = process.env.GORGIAS_DOMAIN || DEFAULT_DOMAIN;
  const username = process.env.GORGIAS_USERNAME;
  const apiKey = process.env.GORGIAS_API_KEY;
  return { domain, username, apiKey };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function gorgiasFetch(path, init = {}) {
  const { domain, username, apiKey } = gorgiasConfig();
  if (!username || !apiKey) {
    throw new Error("Gorgias credentials missing: set GORGIAS_USERNAME and GORGIAS_API_KEY");
  }
  const url = `https://${domain}${path}`;
  const headers = {
    Accept: "application/json",
    Authorization: basicAuthHeader(username, apiKey),
    ...(init.headers || {}),
  };

  // Retry policy:
  // - 429: respect retry-after when present, otherwise exponential backoff
  //   capped at 15s. 10 attempts means we can survive ~60s of pressure.
  // - 500/502/503/504: also retry — Gorgias occasionally returns these
  //   under load and they're transient.
  const MAX_ATTEMPTS = 10;
  const RETRYABLE = new Set([429, 500, 502, 503, 504]);
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

    if (RETRYABLE.has(res.status) && attempt < MAX_ATTEMPTS) {
      const retryAfter = Number(res.headers.get("retry-after"));
      // Bug fixed 2026-05-15: previous code wrapped the final sleep in
      // Math.min(backoff, 15000), which capped server-told Retry-After
      // values at 15s. If Gorgias said "Retry-After: 30", we'd ignore
      // that, retry after 15s, get 429'd again, repeat until we exhausted
      // our 10 retries and threw. Now we honour server-told delays up
      // to 60s (sanity cap so we don't sit forever on bogus headers);
      // only the exponential-fallback path is capped at 15s.
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 60_000)
        : Math.min(500 * 2 ** (attempt - 1), 15_000);
      await sleep(backoff);
      continue;
    }

    if (!res.ok) {
      const message = (body && body.message) || res.statusText || `HTTP ${res.status}`;
      throw new Error(`Gorgias ${res.status}: ${message}`);
    }
    return body;
  }
}

export async function gorgiasHealth() {
  const res = await gorgiasFetch("/api/account");
  return {
    ok: true,
    domain: gorgiasConfig().domain,
    accountId: res?.id ?? null,
    accountName: res?.name ?? null,
  };
}
