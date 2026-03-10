import { NextResponse } from "next/server";
import { fetchRawEngineers, fetchRawProjects } from "@/lib/notionClient";
import { calculateDates } from "@/lib/etaCalculator";

export const revalidate = 60;

export async function GET() {
  const warnings: string[] = [];

  try {
    const [engineers, rawProjects] = await Promise.all([
      fetchRawEngineers(),
      fetchRawProjects(),
    ]);

    // Build engineer ID → assigned project IDs map (from projects side)
    const projectsByEngineer = new Map<string, string[]>();
    for (const project of rawProjects) {
      for (const engId of project.engineerIds) {
        const existing = projectsByEngineer.get(engId) ?? [];
        projectsByEngineer.set(engId, [...existing, project.id]);
      }
    }

    // Compute per-quarter allocation for each engineer — per-engineer isolation
    const enriched = [];
    for (const eng of engineers) {
      try {
        const assignedProjectIds =
          projectsByEngineer.get(eng.id) ?? eng.projectIds;
        const assignedProjects = rawProjects.filter((p) =>
          assignedProjectIds.includes(p.id)
        );

        const quarterAllocations: Record<string, number> = {};
        const quarters = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"] as const;

        for (const q of quarters) {
          const activeCount = assignedProjects.filter((p) => {
            try {
              const { startDate, endDate } = calculateDates(
                p.startDate,
                p.endDate,
                p.tshirtSize,
                p.timeline
              );
              return p.timeline === q || (startDate && endDate && p.timeline === q);
            } catch {
              return false;
            }
          }).length;

          quarterAllocations[q] =
            Math.min(activeCount * (eng.allocationPct / 100), 2.0) * 100;
        }

        enriched.push({
          ...eng,
          projectIds: assignedProjectIds,
          quarterAllocations,
        });
      } catch (err) {
        warnings.push(`Skipped engineer "${eng.name || eng.id}": ${String(err)}`);
      }
    }

    return NextResponse.json({ engineers: enriched, warnings });
  } catch (err) {
    console.error("[/api/engineers]", err);
    return NextResponse.json(
      { error: "Failed to fetch engineers", detail: String(err) },
      { status: 500 }
    );
  }
}
