import { NextResponse } from "next/server";
import { fetchRawProjects, fetchRawEngineers } from "@/lib/notionClient";
import { calculateDates } from "@/lib/etaCalculator";
import { runCascadeEngine } from "@/lib/cascadeEngine";
import { runRiskDetector } from "@/lib/riskDetector";
import { Project, PortfolioPayload } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  const warnings: string[] = [];

  try {
    const [rawProjects, engineers] = await Promise.all([
      fetchRawProjects(),
      fetchRawEngineers(),
    ]);

    const engineerById = new Map(engineers.map((e) => [e.id, e]));

    // Per-project isolation — one bad record does not crash the entire payload
    const projectsWithDates: Project[] = [];
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

        projectsWithDates.push({
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

    const projectsWithCascade = runCascadeEngine(projectsWithDates, engineers);
    const projectsWithRisks = runRiskDetector(projectsWithCascade, engineers);

    const payload: PortfolioPayload = {
      projects: projectsWithRisks,
      engineers,
      generatedAt: new Date().toISOString(),
      warnings,
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[/api/portfolio]", err);
    return NextResponse.json(
      { error: "Failed to fetch portfolio", detail: String(err) },
      { status: 500 }
    );
  }
}
