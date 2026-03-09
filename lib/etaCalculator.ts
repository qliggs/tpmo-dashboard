import { TShirtSize, Timeline } from "./types";

/** T-shirt size → weeks of effort */
const SIZE_TO_WEEKS: Record<TShirtSize, number> = {
  S: 4,
  M: 6,
  L: 12,
  XL: 24,
};

/** Quarter → first calendar day (current year) */
const QUARTER_START: Record<string, [number, number]> = {
  Q1: [0, 1],   // Jan 1
  Q2: [3, 1],   // Apr 1
  Q3: [6, 1],   // Jul 1
  Q4: [9, 1],   // Oct 1
};

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Given a Timeline string like "Q2 2026", return the first day of that quarter
 * as a Date.
 */
export function quarterStartDate(timeline: Timeline): Date {
  const [quarter, yearStr] = timeline.split(" ");
  const year = parseInt(yearStr, 10);
  const [month, day] = QUARTER_START[quarter];
  return new Date(year, month, day);
}

/**
 * Returns the number of weeks for a given T-shirt size.
 */
export function sizeToWeeks(size: TShirtSize): number {
  return SIZE_TO_WEEKS[size];
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
 */
export function calculateDates(
  startDateISO: string,
  endDateISO: string,
  tshirtSize: TShirtSize | null,
  timeline: Timeline | null
): { startDate: string; endDate: string; endDateCalculated: boolean } {
  const durationWeeks = tshirtSize ? sizeToWeeks(tshirtSize) : 4;

  let start: Date;
  let endDateCalculated = false;

  if (startDateISO) {
    start = new Date(startDateISO);
  } else if (timeline) {
    start = quarterStartDate(timeline);
    endDateCalculated = true;
  } else {
    // Fallback: today
    start = new Date();
    endDateCalculated = true;
  }

  let end: Date;
  if (endDateISO) {
    end = new Date(endDateISO);
  } else {
    end = addWeeks(start, durationWeeks);
    endDateCalculated = true;
  }

  return {
    startDate: toISO(start),
    endDate: toISO(end),
    endDateCalculated,
  };
}
