/**
 * checkRoster.ts
 * Fetches all engineer names from the Notion Engineers DB and compares
 * them against the hardcoded ENGINEERS roster in lib/rosterConfig.ts.
 *
 * Run with:
 *   npx tsx scripts/checkRoster.ts
 */

import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { ENGINEERS } from "../lib/rosterConfig";

// Load .env.local manually (tsx doesn't auto-load it)
import { config } from "dotenv";
config({ path: ".env.local" });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_ENGINEERS_DB_ID!;

async function fetchNotionNames(): Promise<string[]> {
  const names: string[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    const params: Parameters<typeof notion.databases.query>[0] = {
      database_id: DB_ID,
      page_size: 100,
    };
    if (cursor) params.start_cursor = cursor;

    const resp = await notion.databases.query(params);

    for (const page of resp.results) {
      if (page.object !== "page" || !("properties" in page)) continue;
      const p = page as PageObjectResponse;
      // "Engineer" rich_text holds the actual name; "Name" title holds team
      const engProp = p.properties["Engineer"];
      const name =
        engProp?.type === "rich_text"
          ? engProp.rich_text.map((t) => t.plain_text).join("").trim()
          : "";
      if (name) names.push(name);
    }

    hasMore = resp.has_more;
    cursor = resp.next_cursor ?? undefined;
  }

  return names;
}

async function main() {
  console.log("Fetching engineers from Notion...\n");
  const notionNames = await fetchNotionNames();
  const rosterNames = ENGINEERS.map((e) => e.name).filter((n, i, arr) => arr.indexOf(n) === i);

  console.log(`Notion DB:      ${notionNames.length} records`);
  console.log(`Roster config:  ${rosterNames.length} unique names\n`);

  // Names in Notion but NOT in roster
  const notInRoster = notionNames.filter((n) => !rosterNames.includes(n));

  // Names in roster but NOT in Notion
  const notInNotion = rosterNames.filter((n) => !notionNames.includes(n));

  // Exact matches
  const matched = notionNames.filter((n) => rosterNames.includes(n));

  console.log(`=== MATCHED (${matched.length}) ===`);
  matched.forEach((n) => console.log(`  ✓  ${n}`));

  if (notInRoster.length > 0) {
    console.log(`\n=== IN NOTION, MISSING FROM ROSTER (${notInRoster.length}) ===`);
    console.log("  These names won't contribute to capacity index calculations.");
    notInRoster.forEach((n) => console.log(`  ✗  "${n}"`));
  } else {
    console.log("\n=== IN NOTION, MISSING FROM ROSTER: none ===");
  }

  if (notInNotion.length > 0) {
    console.log(`\n=== IN ROSTER, MISSING FROM NOTION (${notInNotion.length}) ===`);
    console.log("  These roster entries have no corresponding Notion engineer record.");
    notInNotion.forEach((n) => console.log(`  ✗  "${n}"`));
  } else {
    console.log("\n=== IN ROSTER, MISSING FROM NOTION: none ===");
  }

  // Fuzzy hint: catch likely typos (same name, different case or extra whitespace)
  const fuzzyMisses: { notion: string; roster: string }[] = [];
  for (const nn of notInRoster) {
    const lower = nn.toLowerCase();
    const candidate = rosterNames.find((r) => r.toLowerCase() === lower);
    if (candidate) fuzzyMisses.push({ notion: nn, roster: candidate });
  }
  if (fuzzyMisses.length > 0) {
    console.log(`\n=== LIKELY CASE/SPACING MISMATCHES (${fuzzyMisses.length}) ===`);
    fuzzyMisses.forEach(({ notion, roster }) =>
      console.log(`  Notion: "${notion}"  →  Roster: "${roster}"`)
    );
  }

  const allGood = notInRoster.length === 0 && notInNotion.length === 0;
  console.log(allGood ? "\nAll names match." : "\nAction required — fix mismatches above.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
