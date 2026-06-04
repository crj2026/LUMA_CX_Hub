import fs from "node:fs";
import path from "node:path";
import { db } from "./db";

/**
 * Parse the macros markdown file (prisma/seed/macros-v2.md) into structured
 * macro records.
 *
 * Expected structure per macro (the "MACRO:" prefix is optional — any
 * "Prefix: " before the slug works, so brands can use their own label):
 *   ### MACRO: SlugName
 *   **When:** ... (optional, single line)
 *   **Before sending:** | **Note:** | **Escalation:** ... (optional)
 *
 *   > Hi [Name],
 *   > ...body lines...
 *   > [Sign-off line]
 *   > The [BRAND_NAME] team
 *
 *   ---
 */
export function parseMacrosMarkdown(md) {
  const lines = md.split("\n");
  const macros = [];
  let currentCategory = null;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Top-level category header: "# CATEGORY (n)"
    const catMatch = line.match(/^#\s+([A-Z][A-Z\s—()0-9]+?)(?:\s*\(\d+\))?\s*$/);
    if (catMatch) {
      currentCategory = catMatch[1].trim().replace(/\s+—\s+.*$/, "").replace(/\s+\(\d+\)\s*$/, "");
      // Normalize partnership headers
      if (currentCategory.startsWith("PARTNERSHIPS")) currentCategory = "PARTNERSHIPS";
      i++;
      continue;
    }

    // Macro header: "### MACRO: Slug" (or any "Prefix: Slug", or just "### Slug")
    const slugMatch = line.match(/^###\s+(?:[^:\n]+:\s+)?(.+?)\s*$/);
    if (slugMatch && currentCategory) {
      const slug = slugMatch[1].trim();
      let whenToUse = null;
      let notes = null;
      let question = null;
      let bodyLines = [];

      // Walk forward to collect metadata + body
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (l.startsWith("### ") || l.startsWith("# ") || l.trim() === "---") break;

        // **When:** or **Question:**
        const whenMatch = l.match(/^\*\*When(?:\s*to\s*use)?:\*\*\s*(.+)$/i);
        if (whenMatch) {
          whenToUse = whenMatch[1].trim();
          j++;
          continue;
        }
        const qMatch = l.match(/^\*\*Question:\*\*\s*(.+)$/i);
        if (qMatch) {
          question = qMatch[1].trim();
          j++;
          continue;
        }
        // **Before sending:** / **Note:** / **Escalation:**
        const noteMatch = l.match(/^\*\*(Before sending|Note|Escalation):\*\*\s*(.+)$/i);
        if (noteMatch) {
          notes = (notes ? notes + "\n" : "") + noteMatch[1] + ": " + noteMatch[2].trim();
          j++;
          continue;
        }

        // Blockquote body (> ...)
        if (l.startsWith(">")) {
          bodyLines.push(l.replace(/^>\s?/, ""));
          j++;
          continue;
        }

        j++;
      }

      // Normalize body: strip leading/trailing empty lines, keep internal blank lines
      while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
      while (bodyLines.length && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop();
      const body = bodyLines.join("\n").trim();

      // Detect escalation rule from notes
      let escalationRule = null;
      if (notes) {
        const n = notes.toLowerCase();
        if (n.includes("head of cx")) escalationRule = "head_of_cx";
        else if (n.includes("cs lead") || n.includes("cs_lead")) escalationRule = "cs_lead";
        else if (n.includes("cs manager") || n.includes("cs_manager")) escalationRule = "cs_manager";
        else if (n.includes("escalate to owner")) escalationRule = "head_of_cx";
      }

      // Use whenToUse as question if no explicit question line
      if (!question && whenToUse) question = whenToUse;

      macros.push({
        slug,
        category: normalizeCategory(currentCategory),
        question: question || slug,
        whenToUse,
        notes,
        escalationRule,
        body,
      });

      i = j;
      continue;
    }

    i++;
  }

  return macros;
}

function normalizeCategory(raw) {
  const c = raw.toUpperCase();
  if (c.includes("SAFETY")) return "Safety";
  if (c.includes("PRODUCT QUALITY")) return "Product Quality";
  if (c.includes("PRODUCT")) return "Product";
  if (c.includes("VALUE")) return "Value";
  if (c.includes("RESULTS")) return "Results";
  if (c.includes("SHIPPING")) return "Shipping";
  if (c.includes("SUBSCRIPTION")) return "Subscription";
  if (c.includes("PARTNERSHIP")) return "Partnership";
  return raw;
}

/**
 * Read the macros markdown from prisma/seed and upsert all macros into the DB.
 * Returns counts per category.
 */
export async function seedMacrosFromFile(filename = "macros-v2.md") {
  const filePath = path.join(process.cwd(), "prisma", "seed", filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Macros source file not found at ${filePath}`);
  }
  const md = fs.readFileSync(filePath, "utf8");
  const macros = parseMacrosMarkdown(md);

  const counts = {};
  let upserted = 0;
  for (const m of macros) {
    counts[m.category] = (counts[m.category] || 0) + 1;
    await db.macro.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        category: m.category,
        question: m.question,
        body: m.body,
        whenToUse: m.whenToUse,
        notes: m.notes,
        escalationRule: m.escalationRule,
        sourceDoc: filename,
      },
      update: {
        category: m.category,
        question: m.question,
        body: m.body,
        whenToUse: m.whenToUse,
        notes: m.notes,
        escalationRule: m.escalationRule,
        sourceDoc: filename,
        active: true,
      },
    });
    upserted++;
  }

  return { upserted, counts, total: macros.length };
}
