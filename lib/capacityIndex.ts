import { Project, Engineer, CapacityCell, CapacityContributor, CapacityPayload } from "./types";
import { TEAM_NAMES, getInitiativeFTE, ENGINEERS } from "./rosterConfig";

// ---------------------------------------------------------------------------
// Baseline Index (Armon's model — Q1/Q2 commits as of March 2026)
// ---------------------------------------------------------------------------

export const BASELINE_INDEX: Record<string, Record<string, number>> = {
  "Endpoint Engineering": {
    "2026-01": 123, "2026-02": 123, "2026-03": 123,
    "2026-04": 185, "2026-05": 185, "2026-06": 185,
    "2026-07": 123, "2026-08": 123, "2026-09": 123,
    "2026-10": 0,   "2026-11": 0,   "2026-12": 0,
  },
  "Productivity Apps": {
    "2026-01": 163, "2026-02": 163, "2026-03": 163,
    "2026-04": 163, "2026-05": 163, "2026-06": 163,
    "2026-07": 102, "2026-08": 102, "2026-09": 102,
    "2026-10": 82,  "2026-11": 82,  "2026-12": 82,
  },
  "NetOps": {
    "2026-01": 107, "2026-02": 107, "2026-03": 107,
    "2026-04": 71,  "2026-05": 71,  "2026-06": 71,
    "2026-07": 0,   "2026-08": 0,   "2026-09": 0,
    "2026-10": 0,   "2026-11": 0,   "2026-12": 0,
  },
  "Infrastructure": {
    "2026-01": 114, "2026-02": 114, "2026-03": 114,
    "2026-04": 114, "2026-05": 114, "2026-06": 114,
    "2026-07": 57,  "2026-08": 57,  "2026-09": 57,
    "2026-10": 57,  "2026-11": 57,  "2026-12": 57,
  },
  "Service Desk": {
    "2026-01": 190, "2026-02": 190, "2026-03": 190,
    "2026-04": 143, "2026-05": 143, "2026-06": 143,
    "2026-07": 95,  "2026-08": 95,  "2026-09": 95,
    "2026-10": 0,   "2026-11": 0,   "2026-12": 0,
  },
};

// ---------------------------------------------------------------------------
// Month generation
// ---------------------------------------------------------------------------

/**
 * Generate 12 months starting from a given base month.
 * Returns array of "YYYY-MM" strings.
 */
export function generateMonths(baseYear = 2026): string[] {
  const months: string[] = [];
  for (let m = 1; m <= 12; m++) {
    months.push(`${baseYear}-${String(m).padStart(2, "0")}`);
  }
  return months;
}

/** Check if a project is active during a given month ("YYYY-MM") */
function isActiveInMonth(project: Project, monthStr: string): boolean {
  if (!project.startDate || !project.endDate) return false;
  const [year, month] = monthStr.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // last day of month

  const start = new Date(project.startDate);
  const end = new Date(project.endDate);

  return start <= monthEnd && end >= monthStart;
}

// ---------------------------------------------------------------------------
// Live Index Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the live capacity index for all teams across all months.
 *
 * Live Index (Team, Month) =
 *   Sum of engineer FTE assigned to projects active in that month
 *   / Team Initiative FTE Available × 100
 */
export function calculateCapacityIndex(
  projects: Project[],
  engineers: Engineer[]
): CapacityPayload {
  const months = generateMonths(2026);

  // Build engineer name → team(s) map from roster
  const engineerTeamMap: Record<string, string[]> = {};
  for (const e of ENGINEERS) {
    if (!engineerTeamMap[e.name]) engineerTeamMap[e.name] = [];
    engineerTeamMap[e.name].push(e.team);
  }

  // Build engineer name → capacity fraction map (per team)
  const engineerCapacityMap: Record<string, Record<string, number>> = {};
  for (const e of ENGINEERS) {
    if (!engineerCapacityMap[e.name]) engineerCapacityMap[e.name] = {};
    engineerCapacityMap[e.name][e.team] = e.capacity;
  }

  const cells: CapacityCell[] = [];

  for (const team of TEAM_NAMES) {
    if (team === "TPMO") continue; // TPMO excluded from capacity index (no baseline)

    const initiativeFTEAvailable = getInitiativeFTE(team);

    for (const month of months) {
      const baselineIndex = BASELINE_INDEX[team]?.[month] ?? 0;

      const contributors: CapacityContributor[] = [];
      let totalFTECommitted = 0;

      for (const project of projects) {
        if (!isActiveInMonth(project, month)) continue;

        // Find engineers on this project who belong to this team
        const engContribs: { name: string; fte: number }[] = [];

        for (const engName of project.engineerNames) {
          const teams = engineerTeamMap[engName] ?? [];
          if (!teams.includes(team)) continue;

          const fte = engineerCapacityMap[engName]?.[team] ?? 0;
          if (fte > 0) {
            engContribs.push({ name: engName, fte });
            totalFTECommitted += fte;
          }
        }

        if (engContribs.length > 0) {
          contributors.push({
            projectId: project.id,
            projectName: project.initiative,
            engineers: engContribs,
            totalFTE: engContribs.reduce((s, e) => s + e.fte, 0),
          });
        }
      }

      const liveIndex =
        initiativeFTEAvailable > 0
          ? Math.round((totalFTECommitted / initiativeFTEAvailable) * 100)
          : 0;

      cells.push({
        team,
        month,
        baselineIndex,
        liveIndex,
        delta: liveIndex - baselineIndex,
        contributors,
        initiativeFTEAvailable,
        initiativeFTECommitted: totalFTECommitted,
      });
    }
  }

  return {
    teams: TEAM_NAMES.filter((t) => t !== "TPMO"),
    months,
    cells,
  };
}

// ---------------------------------------------------------------------------
// Heat map color helpers (exported for UI use)
// ---------------------------------------------------------------------------

/** Returns a Tailwind CSS background class based on index value */
export function indexColorClass(index: number): string {
  if (index === 0) return "bg-zinc-700 text-zinc-400";
  if (index < 80) return "bg-green-900 text-green-300";
  if (index <= 100) return "bg-yellow-800 text-yellow-200";
  if (index <= 130) return "bg-orange-700 text-orange-100";
  return "bg-red-700 text-red-100";
}

/** Returns a color class for delta values */
export function deltaColorClass(delta: number): string {
  if (delta < -10) return "bg-blue-900 text-blue-300";
  if (delta <= 10) return "bg-zinc-700 text-zinc-300";
  if (delta <= 30) return "bg-orange-800 text-orange-200";
  return "bg-red-800 text-red-200";
}
