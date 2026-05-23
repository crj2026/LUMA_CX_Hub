import { auth } from "@clerk/nextjs/server";
import { db, dbAvailable } from "../../../../lib/db";
import { seedMacrosFromFile } from "../../../../lib/kb-seed";

export const runtime = "nodejs";

// Run at most one auto-seed per process. Survives simultaneous requests.
let autoSeedPromise = null;

async function ensureMacrosSeeded() {
  const count = await db.macro.count();
  if (count > 0) return { autoSeeded: false, count };
  if (!autoSeedPromise) {
    autoSeedPromise = seedMacrosFromFile("macros-v2.md").catch((err) => {
      autoSeedPromise = null; // allow retry on next request
      throw err;
    });
  }
  const result = await autoSeedPromise;
  return { autoSeeded: true, ...result };
}

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!dbAvailable()) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  // First-time hydration: if the table is empty, seed from the bundled markdown
  let seedInfo = null;
  try {
    seedInfo = await ensureMacrosSeeded();
  } catch (err) {
    return Response.json({ error: `Auto-seed failed: ${err.message}` }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = (searchParams.get("q") || "").trim();

  const where = { active: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { question: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { tag: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const macros = await db.macro.findMany({
      where,
      orderBy: [{ category: "asc" }, { slug: "asc" }],
      select: {
        id: true,
        slug: true,
        category: true,
        tag: true,
        intent: true,
        question: true,
        body: true,
        whenToUse: true,
        notes: true,
        escalationRule: true,
      },
    });

    // Group by category
    const grouped = {};
    for (const m of macros) {
      if (!grouped[m.category]) grouped[m.category] = [];
      grouped[m.category].push(m);
    }
    const categories = Object.keys(grouped).map((c) => ({ name: c, count: grouped[c].length }));

    return Response.json({ macros, grouped, categories, total: macros.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
