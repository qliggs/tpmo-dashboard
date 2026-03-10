import { TShirtSize } from "./types";
import { safeDate, addWeeksToISO, parseTimeline } from "./utils";

/** T-shirt size → weeks of effort */
const SIZE_TO_WEEKS: Record<TShirtSize, number> = {
  S: 4,
  M: 6,
  L: 12,
  XL: 24,
  XXL: 36,
};

/** Quarter → first calendar day [month (0-indexed), day] */
const QUARTER_START: Record<string, [number, number]> = {
  Q1: [0, 1],  // Jan 1
  Q2: [3, 1],  // Apr 1
  Q3: [6, 1],  // Jul 1
  Q4: [9, 1],  // Oct 1
};

/**
 * Given a timeline string (any format — "Q2 2026", "H1 2026", "Q2", etc.),
 * return the first day of the resolved quarter as a Date, or null if unparseable.
 */
export function quarterStartDate(timeline: string): Date | null {
  const normalized = parseTimeline(timeline);
  if (!normalized) return null;

  const parts = normalized.split(" ");
  const quarter = parts[0]; // "Q1" | "Q2" | "Q3" | "Q4"
  const year = parseInt(parts[1], 10);

  const qStart = QUARTER_START[quarter];
  if (!qStart || isNaN(year)) return null;

  return new Date(year, qStart[0], qStart[1]);
}

/**
 * Returns the number of weeks for a given T-shirt size.
 * Accepts an optional custom size map that overrides built-in defaults.
 */
export function sizeToWeeks(
  size: TShirtSize,
  customSizes?: Partial<Record<TShirtSize, number>>
): number {
  return customSizes?.[size] ?? SIZE_TO_WEEKS[size] ?? 4;
}

/**
 * Calculate missing start/end dates for a project.
 *
 * Rules:
 * - If project has Start Date but no End Date → End Date = Start Date + duration
 * - If project has no Start Date → Start Date = first day of Timeline quarter
 *   End Date = Start Date + duration
 * - If neither, fall back to today + duration
 *
 * Returns { startDate, endDate, endDateCalculated }
 *
 * @param customSizes  Optional T-shirt size overrides from user settings.
 */
export function calculateDates(
  startDateISO: string,
  endDateISO: string,
  tshirtSize: TShirtSize | null,
  timeline: string | null,
  customSizes?: Partial<Record<TShirtSize, number>>
): { startDate: string; endDate: string; endDateCalculated: boolean } {
  const durationWeeks = tshirtSize ? sizeToWeeks(tshirtSize, customSizes) : 4;

  // Determine start date
  let startDate: string;
  let endDateCalculated = false;

  const parsedStart = safeDate(startDateISO);
  if (parsedStart) {
    startDate = startDateISO;
  } else if (timeline) {
    const qStart = quarterStartDate(timeline);
    if (qStart) {
      startDate = qStart.toISOString().split("T")[0];
    } else {
      startDate = new Date().toISOString().split("T")[0];
    }
    endDateCalculated = true;
  } else {
    startDate = new Date().toISOString().split("T")[0];
    endDateCalculated = true;
  }

  // Determine end date
  let endDate: string;
  const parsedEnd = safeDate(endDateISO);
  if (parsedEnd) {
    endDate = endDateISO;
  } else {
    const computed = addWeeksToISO(startDate, durationWeeks);
    endDate = computed ?? new Date().toISOString().split("T")[0];
    endDateCalculated = true;
  }

  return { startDate, endDate, endDateCalculated };
}
