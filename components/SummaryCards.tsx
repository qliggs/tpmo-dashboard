"use client";

import { Project, Engineer } from "@/lib/types";
import { TEAM_NAMES, getInitiativeFTE } from "@/lib/rosterConfig";

interface Props {
  projects: Project[];
  engineers: Engineer[];
}

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "red" | "orange" | "yellow" | "green" | "blue";
}) {
  const accentClass = {
    red: "text-red-400",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
    blue: "text-blue-400",
  }[accent ?? "green"];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${accentClass}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

export default function SummaryCards({ projects, engineers }: Props) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentQuarter =
    currentMonth < 3
      ? `Q1 ${currentYear}`
      : currentMonth < 6
      ? `Q2 ${currentYear}`
      : currentMonth < 9
      ? `Q3 ${currentYear}`
      : `Q4 ${currentYear}`;
  const nextQuarterNum =
    currentMonth < 3 ? 2 : currentMonth < 6 ? 3 : currentMonth < 9 ? 4 : 1;
  const nextQuarterYear =
    nextQuarterNum === 1 ? currentYear + 1 : currentYear;
  const nextQuarter = `Q${nextQuarterNum} ${nextQuarterYear}`;

  const activeProjects = projects.filter(
    (p) => p.status && ["In Progress", "Ready to Start"].includes(p.status)
  );

  const atRisk = projects.filter((p) => p.risks.length > 0);

  // Over-allocated: engineer with more projects concurrent than capacity allows
  const engineerAllocMap: Record<string, number> = {};
  for (const eng of engineers) {
    const concurrentProjects = projects.filter(
      (p) =>
        (p.engineerNames.includes(eng.name) || p.engineerIds.includes(eng.id)) &&
        p.status &&
        ["In Progress", "Ready to Start"].includes(p.status)
    );
    engineerAllocMap[eng.name] = concurrentProjects.length * (eng.allocationPct / 100);
  }
  const overAllocEngineers = Object.values(engineerAllocMap).filter((v) => v > 1.0).length;

  // Teams over capacity (simplified: check if any at-risk projects belong to teams with high load)
  const teamsOverCapacity = TEAM_NAMES.filter((team) => {
    const teamFTE = getInitiativeFTE(team);
    if (teamFTE === 0) return false;
    const assignedFTE = engineers
      .filter((e) => e.team === team)
      .reduce((sum, e) => sum + e.allocationPct / 100, 0);
    return assignedFTE > teamFTE;
  }).length;

  const completingThisQ = projects.filter((p) => p.timeline === currentQuarter).length;
  const nextQLoad = projects.filter((p) => p.timeline === nextQuarter).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card
        label="Active Projects"
        value={activeProjects.length}
        sub={`of ${projects.length} total`}
        accent="blue"
      />
      <Card
        label="At Risk"
        value={atRisk.length}
        sub={`${atRisk.filter((p) => p.risks.some((r) => r.severity === "critical")).length} critical`}
        accent={atRisk.length > 0 ? "red" : "green"}
      />
      <Card
        label="Over-Allocated Eng"
        value={overAllocEngineers}
        sub="exceeding 100% capacity"
        accent={overAllocEngineers > 0 ? "orange" : "green"}
      />
      <Card
        label="Teams Over Capacity"
        value={teamsOverCapacity}
        sub="initiative index > 100"
        accent={teamsOverCapacity > 0 ? "orange" : "green"}
      />
      <Card
        label={`Completing ${currentQuarter}`}
        value={completingThisQ}
        sub="planned timeline"
        accent="yellow"
      />
      <Card
        label={`${nextQuarter} Load`}
        value={nextQLoad}
        sub="projects in pipeline"
        accent="blue"
      />
    </div>
  );
}
