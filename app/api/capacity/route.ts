import { NextResponse } from "next/server";
import { fetchRawProjects, fetchRawEngineers } from "@/lib/notionClient";
import { calculateDates } from "@/lib/etaCalculator";
import { calculateCapacityIndex } from "@/lib/capacityIndex";
import { Project } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  try {
    const [rawProjects, engineers] = await Promise.all([
      fetchRawProjects(),
      fetchRawEngineers(),
    ]);

    const engineerById = new Map(engineers.map((e) => [e.id, e]));

    const projects: Project[] = rawProjects.map((p) => {
      const { startDate, endDate, endDateCalculated } = calculateDates(
        p.startDate,
        p.endDate,
        p.tshirtSize,
        p.timeline
      );

      const engineerNames = p.engineerIds
        .map((id) => engineerById.get(id)?.name)
        .filter(Boolean) as string[];

      return {
        ...p,
        startDate,
        endDate,
        endDateCalculated,
        engineerNames,
        risks: [],
      };
    });

    const capacityPayload = calculateCapacityIndex(projects, engineers);

    return NextResponse.json(capacityPayload);
  } catch (err) {
    console.error("[/api/capacity]", err);
    return NextResponse.json(
      { error: "Failed to calculate capacity", detail: String(err) },
      { status: 500 }
    );
  }
}
