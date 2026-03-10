import { Project, Engineer, RiskFlag, RiskSeverity, RiskType } from "./types";
import { safeDate } from "./utils";

const QUARTERS: string[] = [
  "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026",
  "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027",
];

/** Returns the quarter string that a date falls in, or null */
function getQuarterForDate(iso: string): string | null {
  if (!iso) return null;
  const d = safeDate(iso);
  if (!d) return null;
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();
  const quarter =
    month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";
  return `${quarter} ${year}`;
}

/** Returns the quarter index in the known list, or -1 */
function quarterIndex(q: string | null): number {
  if (!q) return -1;
  return QUARTERS.indexOf(q);
}

const RECOMMENDED_ACTIONS: Record<RiskType, string> = {
  TIMELINE_SLIP:
    "Review scope or negotiate timeline with stakeholders. Consider re-prioritizing or adding resources.",
  ENGINEER_OVERALLOCATION:
    "Rebalance assignments across engineers. Consider deferring lower-priority work.",
  CASCADE_DELAY:
    "Expedite blocking project or reassign cascade-affected work to available engineers.",
  END_DATE_SLIP:
    "Adjust project plan or communicate revised delivery date to stakeholders.",
};

/**
 * Detect all risk flags for a project.
 * Requires projects to have startDate/endDate already calculated.
 *
 * @param project      The project to evaluate.
 * @param allProjects  Full project list — used to find concurrent work per engineer.
 * @param engineers    Engineer roster for capacity info.
 * @param warnPct      Overallocation warning threshold (default 100 = 1.0 FTE).
 * @param critPct      Overallocation critical threshold (default 130 = 1.3 FTE).
 */
export function detectProjectRisks(
  project: Project,
  allProjects: Project[],
  engineers: Engineer[],
  warnPct = 100,
  critPct = 130
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // 1. Timeline slip — calculated end date falls in a later quarter
  const plannedQuarter = project.timeline;
  const calculatedQuarter = getQuarterForDate(project.endDate);

  if (plannedQuarter && calculatedQuarter) {
    const plannedIdx = quarterIndex(plannedQuarter);
    const calcIdx = quarterIndex(calculatedQuarter);

    if (plannedIdx !== -1 && calcIdx > plannedIdx) {
      const slipQuarters = calcIdx - plannedIdx;
      const severity: RiskSeverity = slipQuarters > 1 ? "critical" : "warning";
      flags.push({
        type: "TIMELINE_SLIP",
        severity,
        reason: `Project planned for ${plannedQuarter} but calculated end date falls in ${calculatedQuarter}.`,
        recommendedAction: RECOMMENDED_ACTIONS.TIMELINE_SLIP,
      });
    }
  }

  // 2. Engineer overallocation — sum resourcesNeeded across concurrent projects
  const projStart = safeDate(project.startDate);
  const projEnd = safeDate(project.endDate);

  for (const engineerName of project.engineerNames) {
    const eng = engineers.find((e) => e.name === engineerName);
    if (!eng) continue;

    // Collect all projects this engineer is on that overlap with the current project
    const concurrent = allProjects.filter((p) => {
      if (!p.engineerNames.includes(engineerName)) return false;
      // Always include self so its resourcesNeeded counts
      if (p.id === project.id) return true;
      // Skip projects with no usable dates
      const pStart = safeDate(p.startDate);
      const pEnd = safeDate(p.endDate);
      if (!pStart || !pEnd || !projStart || !projEnd) return false;
      // Overlapping date ranges: A.start <= B.end && A.end >= B.start
      return pStart <= projEnd && pEnd >= projStart;
    });

    // Sum the FTE fraction required across all concurrent projects
    const totalFTE = concurrent.reduce(
      (sum, p) => sum + (p.resourcesNeeded ?? 1.0),
      0
    );

    const warnFrac = warnPct / 100;
    const critFrac = critPct / 100;

    if (totalFTE > warnFrac) {
      const severity: RiskSeverity = totalFTE > critFrac ? "critical" : "warning";
      flags.push({
        type: "ENGINEER_OVERALLOCATION",
        severity,
        reason: `${engineerName} is committed at ${Math.round(totalFTE * 100)}% across ${concurrent.length} concurrent project${concurrent.length !== 1 ? "s" : ""}, exceeding ${warnPct}% capacity.`,
        affectedEngineer: engineerName,
        recommendedAction: RECOMMENDED_ACTIONS.ENGINEER_OVERALLOCATION,
      });
    }
  }

  // 3. Cascade delay
  if (project.cascadeDelay) {
    const { engineer, blockingProject, originalStart, newStart } =
      project.cascadeDelay;
    flags.push({
      type: "CASCADE_DELAY",
      severity: "warning",
      reason: `${engineer} is blocked by "${blockingProject}". Start delayed from ${originalStart} to ${newStart}.`,
      affectedEngineer: engineer,
      recommendedAction: RECOMMENDED_ACTIONS.CASCADE_DELAY,
    });
  }

  // 4. End date slip — calculated end is 14+ days after Notion end date
  // (only meaningful if endDate was not calculated by us)
  if (!project.endDateCalculated && project.cascadeDelay?.newEnd) {
    const original = safeDate(project.endDate);
    const newEnd = safeDate(project.cascadeDelay.newEnd);
    if (original && newEnd) {
      const diffDays = (newEnd.getTime() - original.getTime()) / 86400000;
      if (diffDays >= 14) {
        flags.push({
          type: "END_DATE_SLIP",
          severity: diffDays >= 90 ? "critical" : "warning",
          reason: `Cascade delay pushes end date ${Math.round(diffDays)} days past original end date.`,
          recommendedAction: RECOMMENDED_ACTIONS.END_DATE_SLIP,
        });
      }
    }
  }

  return flags;
}

/**
 * Run risk detection across all projects.
 * Returns projects with risks populated.
 *
 * @param projects   All projects (needed for concurrent-project lookups).
 * @param engineers  Engineer roster.
 * @param warnPct    Overallocation warning threshold % (default 100).
 * @param critPct    Overallocation critical threshold % (default 130).
 */
export function runRiskDetector(
  projects: Project[],
  engineers: Engineer[],
  warnPct = 100,
  critPct = 130
): Project[] {
  return projects.map((p) => ({
    ...p,
    risks: detectProjectRisks(p, projects, engineers, warnPct, critPct),
  }));
}
