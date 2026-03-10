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
  const borderClass = {
    red: "border-l-red-500",
    orange: "border-l-amber-500",
    yellow: "border-l-yellow-500",
    green: "border-l-emerald-500",
    blue: "border-l-blue-500",
  }[accent ?? "blue"];

  const valueClass = {
    red: "text-red-400",
    orange: "text-amber-400",
    yellow: "text-yellow-400",
    green: "text-emerald-400",
    blue: "text-blue-400",
  }[accent ?? "blue"];

  return (
    <div
      className={`bg-slate-900 border border-slate-800 border-l-2 ${borderClass} rounded-lg p-6 flex flex-col gap-1 hover:bg-slate-800/50 transition-colors`}
    >
      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
        {label}
      </span>
      <span className={`text-4xl font-bold font-mono leading-none mt-1 ${valueClass}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-slate-600 mt-1">{sub}</span>}
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

  // Over-allocated: sum resourcesNeeded across concurrent active projects > 1.0 FTE
  const engineerAllocMap: Record<string, number> = {};
  for (const eng of engineers) {
    const concurrentProjects = projects.filter(
      (p) =>
        (p.engineerNames.includes(eng.name) || p.engineerIds.includes(eng.id)) &&
        p.status &&
        ["In Progress", "Ready to Start"].includes(p.status)
    );
    // Correct formula: sum of FTE fractions required across concurrent projects
    engineerAllocMap[eng.name] = concurrentProjects.reduce(
      (sum, p) => sum + (p.resourcesNeeded ?? 1.0),
      0
    );
  }
  // Deduplicate by name (engineers can appear on multiple teams)
  const uniqueAllocValues = Object.entries(engineerAllocMap).reduce<Record<string, number>>(
    (acc, [name, frac]) => {
      acc[name] = (acc[name] ?? 0) + frac;
      return acc;
    },
    {}
  );
  const overAllocEngineers = Object.values(uniqueAllocValues).filter((v) => v > 1.0).length;

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
        label="Over-Cap Teams"
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
