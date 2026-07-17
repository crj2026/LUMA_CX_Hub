// Pure chart helpers — deterministic demo series + SVG path building.
//
// Series are seeded from the metric key so the server routes and the
// client bundle always generate identical data (no hydration drift), and
// the same metric always draws the same believable shape.

function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// n-point series drifting from `start` to `end` with seeded noise.
// Endpoints are exact so the last point always matches the headline stat.
export function seededSeries(key, n, start, end, volatility = 0.05) {
  const rand = mulberry32(hashSeed(key));
  const out = [];
  const span = Math.abs(end - start) || Math.abs(end) || 1;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1);
    // Ease the drift slightly so trends read organic, not linear.
    const eased = t * t * (3 - 2 * t);
    const base = start + (end - start) * eased;
    const noise = (rand() - 0.5) * 2 * span * volatility * (i === 0 || i === n - 1 ? 0 : 1);
    out.push(base + noise);
  }
  return out;
}

// Polyline path for an SVG sparkline. Returns the path string plus the
// final point so callers can dot the "now" end of the line.
export function sparklinePath(values, w, h, pad = 2) {
  if (!values || values.length < 2) return { path: "", lastX: 0, lastY: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [
    pad + i * step,
    pad + (h - pad * 2) * (1 - (v - min) / range),
  ]);
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = pts[pts.length - 1];
  return { path, lastX, lastY };
}
