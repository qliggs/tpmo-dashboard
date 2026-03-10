import { Project, Engineer, CascadeDelay } from "./types";
import { sizeToWeeks } from "./etaCalculator";
import { safeDate, addWeeksToISO } from "./utils";

function laterDate(a: string, b: string): string {
  return a >= b ? a : b;
}

/**
 * Run cascade delay detection across all projects and engineers.
 *
 * Algorithm:
 * 1. For each engineer, collect all projects assigned, sorted by start date.
 * 2. Engineer "free" date = max endDate across all In Progress or Ready to Start projects.
 * 3. For each future project assigned to this engineer:
 *    - If engineer free date > project planned start → delay
 * 4. Also respect engineer.availableFrom field.
 * 5. Re-run until stable (handles chains).
 *
 * Mutates projects in place — attaches CascadeDelay to affected projects.
 */
export function runCascadeEngine(
  projects: Project[],
  engineers: Engineer[]
): Project[] {
  // Work with copies
  const result: Project[] = projects.map((p) => ({ ...p }));

  const MAX_ITERATIONS = 10;
  let changed = true;
  let iterations = 0;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    for (const engineer of engineers) {
      // Collect all projects for this engineer
      const assigned = result.filter(
        (p) =>
          p.engineerNames.includes(engineer.name) ||
          p.engineerIds.includes(engineer.id)
      );

      if (assigned.length === 0) continue;

      // Sort by start date — skip projects with no valid start date
      assigned.sort((a, b) => a.startDate.localeCompare(b.startDate));

      // Engineer free date = max end date of active (non-future) projects
      const activeStatuses = ["In Progress", "Ready to Start"];
      const activeProjects = assigned.filter(
        (p) => p.status && activeStatuses.includes(p.status)
      );

      let engineerFreeDate =
        activeProjects.length > 0
          ? activeProjects.reduce(
              (max, p) => (p.endDate ? laterDate(max, p.endDate) : max),
              "2000-01-01"
            )
          : "2000-01-01";

      // Also respect availableFrom
      if (engineer.availableFrom) {
        engineerFreeDate = laterDate(engineerFreeDate, engineer.availableFrom);
      }

      // Check future projects
      for (const project of assigned) {
        // Skip projects without valid dates — cannot cascade
        if (!project.startDate || !safeDate(project.startDate)) continue;
        if (!project.endDate || !safeDate(project.endDate)) continue;
        if (project.status === "In Progress") continue; // already started

        if (engineerFreeDate > project.startDate) {
          const newStart = engineerFreeDate;
          const durationWeeks = project.tshirtSize
            ? sizeToWeeks(project.tshirtSize)
            : 4;
          const computedEnd = addWeeksToISO(newStart, durationWeeks);
          if (!computedEnd) {
            // Cannot calculate — advance free date and continue
            engineerFreeDate = laterDate(engineerFreeDate, project.endDate);
            continue;
          }
          const newEnd = computedEnd;

          // Find blocking project
          const blockingProject =
            activeProjects.find((p) => p.endDate === engineerFreeDate)
              ?.initiative ?? "unknown";

          if (newStart !== project.startDate || newEnd !== project.endDate) {
            const idx = result.findIndex((p) => p.id === project.id);
            if (idx !== -1) {
              result[idx] = {
                ...result[idx],
                cascadeDelay: {
                  engineer: engineer.name,
                  blockingProject,
                  originalStart: project.startDate,
                  newStart,
                  newEnd,
                } satisfies CascadeDelay,
              };
            }
            changed = true;
          }

          // Advance free date for chaining
          engineerFreeDate = laterDate(engineerFreeDate, newEnd);
        } else {
          engineerFreeDate = laterDate(engineerFreeDate, project.endDate);
        }
      }
    }
  }

  return result;
}
