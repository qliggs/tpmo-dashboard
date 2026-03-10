import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Engineer, Project, Priority } from "./types";
import { ENGINEERS } from "./rosterConfig";
import { parseTimeline, safeTShirtSize, safeStatus } from "./utils";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const PROJECTS_DB = process.env.NOTION_PROJECTS_DB_ID!;
const ENGINEERS_DB = process.env.NOTION_ENGINEERS_DB_ID!;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTitle(page: PageObjectResponse, field: string): string {
  const prop = page.properties[field];
  if (!prop || prop.type !== "title") return "";
  return prop.title.map((t) => t.plain_text).join("") ?? "";
}

function getRichText(page: PageObjectResponse, field: string): string {
  const prop = page.properties[field];
  if (!prop || prop.type !== "rich_text") return "";
  return prop.rich_text.map((t) => t.plain_text).join("") ?? "";
}

function getSelect(page: PageObjectResponse, field: string): string | null {
  const prop = page.properties[field];
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

function getDate(page: PageObjectResponse, field: string): string | null {
  const prop = page.properties[field];
  if (!prop || prop.type !== "date") return null;
  return prop.date?.start ?? null;
}

function getNumber(page: PageObjectResponse, field: string): number | null {
  const prop = page.properties[field];
  if (!prop || prop.type !== "number") return null;
  return prop.number ?? null;
}

function getRelationIds(page: PageObjectResponse, field: string): string[] {
  const prop = page.properties[field];
  if (!prop || prop.type !== "relation") return [];
  return prop.relation.map((r) => r.id);
}

/** Fetch all pages from a Notion database (handles pagination) */
async function fetchAllPages(databaseId: string): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  while (hasMore) {
    const params: Parameters<typeof notion.databases.query>[0] = {
      database_id: databaseId,
      page_size: 100,
    };
    if (cursor) params.start_cursor = cursor;

    const resp = await notion.databases.query(params);

    for (const page of resp.results) {
      if (
        page.object === "page" &&
        "properties" in page &&
        !page.archived // skip archived pages
      ) {
        pages.push(page as PageObjectResponse);
      }
    }

    hasMore = resp.has_more;
    cursor = resp.next_cursor ?? undefined;
  }

  return pages;
}

// ---------------------------------------------------------------------------
// Public fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch raw projects from Notion.
 * Does NOT run ETA/cascade/risk logic — those live in separate modules.
 */
export async function fetchRawProjects(): Promise<
  Omit<Project, "risks" | "cascadeDelay">[]
> {
  const pages = await fetchAllPages(PROJECTS_DB);

  return pages
    .map((page) => {
      const rawStatus = getSelect(page, "Status");

      // Skip projects with Archived or Cancelled status before any further processing
      if (rawStatus === "Archived" || rawStatus === "Cancelled") return null;

      const engineerIds = getRelationIds(page, "Resources Needed");

      // Normalize timeline via parser — handles Q1/H1/Q1-no-year/null
      const rawTimeline = getRichText(page, "Timeline") || getSelect(page, "Timeline");
      const timeline = parseTimeline(rawTimeline);

      return {
        id: page.id,
        initiative: getTitle(page, "Initiative"),
        deliverable: getRichText(page, "Deliverable"),
        startDate: getDate(page, "Start Date") ?? "",
        endDate: getDate(page, "End Date") ?? "",
        endDateCalculated: false,
        // Use safe cast — returns null for unrecognized values
        tshirtSize: safeTShirtSize(getSelect(page, "Size")),
        priority: (getSelect(page, "Priority") as Priority) ?? null,
        // Use safeStatus — returns "Unknown" for unrecognized values, null if absent
        status: safeStatus(rawStatus),
        timeline,
        engineerIds,
        engineerNames: [],
        // FTE fraction required per assigned engineer (0–N). Defaults to 1.0 if the
        // Notion field is absent or is a relation type (getNumber returns null for
        // non-number properties, making the fallback safe).
        resourcesNeeded: getNumber(page, "Resources Needed Fraction") ?? 1.0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

/**
 * Fetch raw engineers from Notion.
 *
 * Actual DB schema (verified):
 *   - "Engineer" (rich_text) — engineer's name
 *   - "Name"     (title)     — team name (used as the row label in Notion)
 *   - "Allocation %" (number)
 *   - "Available From" (date)
 *   - "Projects" (relation)
 */
export async function fetchRawEngineers(): Promise<Engineer[]> {
  const pages = await fetchAllPages(ENGINEERS_DB);

  return pages.map((page) => {
    // Name is in the "Engineer" rich_text field; "Name" title holds the team
    const name = getRichText(page, "Engineer") || getTitle(page, "Name");
    const teamFromNotion = getTitle(page, "Name"); // team name stored in title

    // Prefer roster config for team (authoritative), fall back to Notion title
    const rosterEntry = ENGINEERS.find((e) => e.name === name);

    return {
      id: page.id,
      name,
      team: rosterEntry?.team ?? teamFromNotion ?? "Unknown",
      allocationPct:
        getNumber(page, "Allocation %") != null
          ? getNumber(page, "Allocation %")! * 100 // Notion stores 0–1 fraction
          : (rosterEntry?.capacity ?? 1) * 100,
      availableFrom: getDate(page, "Available From"),
      projectIds: getRelationIds(page, "Projects"),
    };
  });
}
