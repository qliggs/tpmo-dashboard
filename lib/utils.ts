/**
 * Shared defensive utilities for parsing untrusted Notion data.
 * All functions are pure and safe to call with any input.
 */

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

/**
 * Safely parse an ISO date string (or unknown value) into a Date.
 * Returns null if the input is falsy, not a string, or produces an invalid date.
 */
export function safeDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Add weeks to an ISO date string. Returns null if the input date is invalid.
 */
export function addWeeksToISO(dateISO: string, weeks: number): string | null {
  const d = safeDate(dateISO);
  if (!d) return null;
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Timeline parser
// ---------------------------------------------------------------------------

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Normalizes a Notion "Timeline" field value into "Q{n} YYYY" format.
 *
 * Handles:
 *  "Q2 2026"        → "Q2 2026"   (already canonical)
 *  "H1 2026"        → "Q1 2026"   (first quarter of that half-year)
 *  "H2 2026"        → "Q3 2026"   (first quarter of H2)
 *  "Q2" (no year)   → "Q2 CURRENT_YEAR"
 *  "H2" (no year)   → "Q3 CURRENT_YEAR"
 *  null / ""        → null
 *  anything else    → null
 */
export function parseTimeline(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  // Already canonical: "Q{1-4} YYYY"
  if (/^Q[1-4]\s+\d{4}$/.test(s)) return s;

  // Quarter only, no year: "Q{1-4}"
  const qOnly = s.match(/^Q([1-4])$/i);
  if (qOnly) return `Q${qOnly[1]} ${CURRENT_YEAR}`;

  // Half-year with year: "H{1-2} YYYY"
  const hYear = s.match(/^H([12])\s+(\d{4})$/i);
  if (hYear) {
    const half = parseInt(hYear[1], 10);
    const year = hYear[2];
    return half === 1 ? `Q1 ${year}` : `Q3 ${year}`;
  }

  // Half-year only, no year: "H{1-2}"
  const hOnly = s.match(/^H([12])$/i);
  if (hOnly) {
    const half = parseInt(hOnly[1], 10);
    return half === 1 ? `Q1 ${CURRENT_YEAR}` : `Q3 ${CURRENT_YEAR}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Enum helpers
// ---------------------------------------------------------------------------

const VALID_TSHIRT_SIZES = new Set(["S", "M", "L", "XL", "XXL"]);

const VALID_STATUSES = new Set([
  "Not Started",
  "Ready to Start",
  "In Progress",
  "Blocked",
  "Archived",
  "Cancelled",
]);

export function safeTShirtSize(
  raw: unknown
): "S" | "M" | "L" | "XL" | "XXL" | null {
  if (!raw || typeof raw !== "string") return null;
  return VALID_TSHIRT_SIZES.has(raw)
    ? (raw as "S" | "M" | "L" | "XL" | "XXL")
    : null;
}

export function safeStatus(raw: unknown):
  | "Not Started"
  | "Ready to Start"
  | "In Progress"
  | "Blocked"
  | "Archived"
  | "Cancelled"
  | "Unknown"
  | null {
  if (!raw || typeof raw !== "string") return null;
  if (VALID_STATUSES.has(raw))
    return raw as
      | "Not Started"
      | "Ready to Start"
      | "In Progress"
      | "Blocked"
      | "Archived"
      | "Cancelled";
  return "Unknown";
}
