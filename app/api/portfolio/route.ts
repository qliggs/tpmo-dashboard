import { NextResponse } from "next/server";
import { fetchRawProjects, fetchRawEngineers } from "@/lib/notionClient";
import { calculateDates } from "@/lib/etaCalculator";
import { runCascadeEngine } from "@/lib/cascadeEngine";
import { runRiskDetector } from "@/lib/riskDetector";
import { Project, PortfolioPayload } from "@/lib/types";

export const revalidate = 60;

export async function GET() {
  try {
    const [rawProjects, engineers] = await Promise.all([
      fetchRawProjects(),
      fetchRawEngineers(),
    ]);

    const engineerById = new Map(engineers.map((e) => [e.id, e]));

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

    const projectsWithCascade = runCascadeEngine(projectsWithDates, engineers);
    const projectsWithRisks = runRiskDetector(projectsWithCascade, engineers);

    const payload: PortfolioPayload = {
      projects: projectsWithRisks,
      engineers,
      generatedAt: new Date().toISOString(),
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
