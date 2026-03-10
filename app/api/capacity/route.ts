import { NextResponse } from "next/server";
import { fetchRawProjects, fetchRawEngineers } from "@/lib/notionClient";
import { calculateDates } from "@/lib/etaCalculator";
import { calculateCapacityIndex } from "@/lib/capacityIndex";
import { Project } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  const warnings: string[] = [];

  try {
    const [rawProjects, engineers] = await Promise.all([
      fetchRawProjects(),
      fetchRawEngineers(),
    ]);

    const engineerById = new Map(engineers.map((e) => [e.id, e]));

    // Per-project isolation
    const projects: Project[] = [];
    for (const p of rawProjects) {
      try {
        const { startDate, endDate, endDateCalculated } = calculateDates(
          p.startDate,
          p.endDate,
          p.tshirtSize,
          p.timeline
        );

        const engineerNames = p.engineerIds
          .map((id) => engineerById.get(id)?.name)
          .filter(Boolean) as string[];

        projects.push({
          ...p,
          startDate,
          endDate,
          endDateCalculated,
          engineerNames,
          risks: [],
        });
      } catch (err) {
        warnings.push(
          `Skipped project "${p.initiative || p.id}": ${String(err)}`
        );
      }
    }

    const capacityPayload = calculateCapacityIndex(projects, engineers);

    return NextResponse.json({ ...capacityPayload, warnings });
  } catch (err) {
    console.error("[/api/capacity]", err);
    return NextResponse.json(
      { error: "Failed to calculate capacity", detail: String(err) },
      { status: 500 }
    );
  }
}
