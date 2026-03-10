import { NextResponse } from "next/server";
import { fetchRawProjects, fetchRawEngineers } from "@/lib/notionClient";

/** No caching — health check should always reflect live state */
export const revalidate = 0;

export async function GET() {
  const lastFetched = new Date().toISOString();
  const warnings: string[] = [];

  let notionConnected = false;
  let projectsLoaded = 0;
  let engineersLoaded = 0;

  try {
    const [projects, engineers] = await Promise.all([
      fetchRawProjects().catch((err) => {
        warnings.push(`Projects fetch failed: ${String(err)}`);
        return [];
      }),
      fetchRawEngineers().catch((err) => {
        warnings.push(`Engineers fetch failed: ${String(err)}`);
        return [];
      }),
    ]);

    projectsLoaded = projects.length;
    engineersLoaded = engineers.length;
    notionConnected = projectsLoaded > 0 || engineersLoaded > 0;
  } catch (err) {
    warnings.push(`Health check error: ${String(err)}`);
  }

  const status =
    !notionConnected
      ? "degraded"
      : warnings.length > 0
      ? "warning"
      : "ok";

  return NextResponse.json(
    {
      status,
      notionConnected,
      projectsLoaded,
      engineersLoaded,
      warnings,
      lastFetched,
    },
    // Return 200 always — let consumers decide based on status field
    { status: 200 }
  );
}
