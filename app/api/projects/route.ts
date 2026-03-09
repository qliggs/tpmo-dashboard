import { NextResponse } from "next/server";
import { fetchRawProjects, fetchRawEngineers } from "@/lib/notionClient";
import { calculateDates } from "@/lib/etaCalculator";
import { runCascadeEngine } from "@/lib/cascadeEngine";
import { runRiskDetector } from "@/lib/riskDetector";
import { Project } from "@/lib/types";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const [rawProjects, engineers] = await Promise.all([
      fetchRawProjects(),
      fetchRawEngineers(),
    ]);

    // Build engineer name lookup by ID
    const engineerById = new Map(engineers.map((e) => [e.id, e]));

    // Apply ETA calculations and resolve engineer names
    const projectsWithDates: Project[] = rawProjects.map((p) => {
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

    // Run cascade engine
    const projectsWithCascade = runCascadeEngine(projectsWithDates, engineers);

    // Run risk detector
    const projectsWithRisks = runRiskDetector(projectsWithCascade, engineers);

    return NextResponse.json(projectsWithRisks);
  } catch (err) {
    console.error("[/api/projects]", err);
    return NextResponse.json(
      { error: "Failed to fetch projects", detail: String(err) },
      { status: 500 }
    );
  }
}
