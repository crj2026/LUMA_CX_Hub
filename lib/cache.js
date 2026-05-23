import { db } from "./db";

// Two-tier cache.
// L1 (in-memory) — fastest, lost on container restart / redeploy.
// L2 (Postgres CacheEntry) — survives restarts so users don't pay
// the cold-load tax after every push. Writes to L2 are fire-and-
// forget so saves don't block the response.

const memCache = new Map();

export function getCached(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs) {
  memCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function readL2(key) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const row = await db.cacheEntry.findUnique({ where: { key } });
    if (!row) return null;
    if (row.expiresAt.getTime() <= Date.now()) return null;
    return { value: row.value, expiresAt: row.expiresAt.getTime() };
  } catch (e) {
    // DB blip — treat as cache miss, don't break the request
    console.warn("[cache] L2 read failed:", e?.message ?? e);
    return null;
  }
}

function writeL2(key, value, ttlMs) {
  if (!process.env.DATABASE_URL) return;
  const expiresAt = new Date(Date.now() + ttlMs);
  // Fire-and-forget — don't block the response on the cache write
  db.cacheEntry.upsert({
    where: { key },
    create: { key, value, expiresAt },
    update: { value, expiresAt },
  }).catch((e) => console.warn("[cache] L2 write failed:", e?.message ?? e));
}

export async function cached(key, ttlMs, loader) {
  // L1 hit
  const l1 = getCached(key);
  if (l1 !== null) return { value: l1, fromCache: true };

  // L2 hit — populate L1 from L2 with the remaining TTL
  const l2 = await readL2(key);
  if (l2) {
    const remaining = l2.expiresAt - Date.now();
    if (remaining > 0) {
      memCache.set(key, { value: l2.value, expiresAt: l2.expiresAt });
      return { value: l2.value, fromCache: true };
    }
  }

  // Miss — load fresh, populate both layers
  const value = await loader();
  setCached(key, value, ttlMs);
  writeL2(key, value, ttlMs);
  return { value, fromCache: false };
}

// One-shot helper used by the warm-cache cron — clears any expired
// rows so the table doesn't grow forever.
export async function pruneExpiredCache() {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const res = await db.cacheEntry.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return res.count;
  } catch {
    return 0;
  }
}
