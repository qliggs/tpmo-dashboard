import { Project, Engineer, RiskFlag, RiskSeverity, RiskType } from "./types";
import { quarterStartDate } from "./etaCalculator";
import { Timeline } from "./types";

const QUARTERS: Timeline[] = [
  "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026",
  "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027",
];

/** Returns the quarter string that a date falls in, or null */
function getQuarterForDate(iso: string): Timeline | null {
  if (!iso) return null;
  const d = new Date(iso);
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();
  const quarter =
    month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";
  return `${quarter} ${year}` as Timeline;
}

/** Returns the quarter index (0–3) or -1 */
function quarterIndex(q: Timeline | null): number {
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
 */
export function detectProjectRisks(
  project: Project,
  engineers: Engineer[]
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // 1. Timeline slip — calculated end date falls in a later quarter
  const plannedQuarter = project.timeline;
  const calculatedQuarter = getQuarterForDate(project.endDate);

  if (plannedQuarter && calculatedQuarter) {
    const plannedIdx = quarterIndex(plannedQuarter);
    const calcIdx = quarterIndex(calculatedQuarter);

    if (calcIdx > plannedIdx) {
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

  // 2. Engineer overallocation
  for (const engineerName of project.engineerNames) {
    const eng = engineers.find((e) => e.name === engineerName);
    if (!eng) continue;

    // Count concurrent projects for this engineer during this project's window
    // (simplified: check if allocation sum would exceed capacity)
    const allocationFrac = eng.allocationPct / 100;
    // If an engineer is committed at > 100% capacity, flag
    if (allocationFrac > 1.0) {
      const severity: RiskSeverity = allocationFrac > 1.3 ? "critical" : "warning";
      flags.push({
        type: "ENGINEER_OVERALLOCATION",
        severity,
        reason: `${engineerName} is allocated at ${eng.allocationPct}%, exceeding 100% capacity.`,
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
    const original = new Date(project.endDate);
    const newEnd = new Date(project.cascadeDelay.newEnd);
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

  return flags;
}

/**
 * Run risk detection across all projects.
 * Returns projects with risks populated.
 */
export function runRiskDetector(
  projects: Project[],
  engineers: Engineer[]
): Project[] {
  return projects.map((p) => ({
    ...p,
    risks: detectProjectRisks(p, engineers),
  }));
}
