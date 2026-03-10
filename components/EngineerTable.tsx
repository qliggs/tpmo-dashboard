"use client";

import { useState, useMemo } from "react";
import { Engineer, Project } from "@/lib/types";
import { ENGINEERS, TEAM_CONFIG, getInitiativeFTE } from "@/lib/rosterConfig";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as RechartsCell,
} from "recharts";

interface Props {
  engineers: Engineer[];
  projects: Project[];
}

type TabMode = "engineers" | "teams";

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027"] as const;

export default function EngineerTable({ engineers, projects }: Props) {
  const [tab, setTab] = useState<TabMode>("engineers");

  // Build per-engineer, per-quarter active project count.
  // Group by name first to merge multi-team entries into a single row
  // (e.g., Gary Olivieri at 50% Endpoint + 50% Productivity Apps → one row).
  const engineerStats = useMemo(() => {
    const grouped = new Map<string, Engineer[]>();
    for (const eng of engineers) {
      if (!grouped.has(eng.name)) grouped.set(eng.name, []);
      grouped.get(eng.name)!.push(eng);
    }

    return Array.from(grouped.entries()).map(([name, engs]) => {
      const teamLabel = Array.from(new Set(engs.map((e) => e.team))).join(" / ");
      const totalAlloc = engs.reduce((s, e) => s + e.allocationPct, 0);
      const capLabel =
        engs.length > 1
          ? engs.map((e) => `${e.allocationPct}%`).join("+")
          : `${engs[0].allocationPct}%`;

      const quarters: Record<string, number> = {};
      for (const q of QUARTERS) {
        const active = projects.filter(
          (p) =>
            p.timeline === q &&
            engs.some(
              (e) => p.engineerNames.includes(e.name) || p.engineerIds.includes(e.id)
            )
        );
        // Sum resourcesNeeded across concurrent projects — each project contributes
        // its FTE fraction, so quarters[q] reflects true utilization percentage.
        const fteRequired = active.reduce((sum, p) => sum + (p.resourcesNeeded ?? 1.0), 0);
        quarters[q] = Math.round(fteRequired * 100);
      }

      const isOverloaded = Object.values(quarters).some((v) => v > 100);

      return {
        id: engs[0].id,
        name,
        team: teamLabel,
        allocationPct: totalAlloc,
        capLabel,
        quarters,
        isOverloaded,
      };
    });
  }, [engineers, projects]);

  // Team allocation chart data
  const teamData = useMemo(() => {
    return Object.entries(TEAM_CONFIG).map(([team, cfg]) => {
      const initiativeFTE = getInitiativeFTE(team);
      const rosterFTE = ENGINEERS.filter((e) => e.team === team).reduce(
        (s, e) => s + e.capacity,
        0
      );
      void rosterFTE;
      const committedFTE = ENGINEERS.filter((e) => e.team === team).reduce((sum, rEng) => {
        const activeForEng = projects.filter(
          (p) =>
            p.status &&
            ["In Progress", "Ready to Start"].includes(p.status) &&
            p.engineerNames.includes(rEng.name)
        );
        // Use resourcesNeeded per project rather than counting projects × capacity
        const fteSum = activeForEng.reduce((s, p) => s + (p.resourcesNeeded ?? 1.0), 0);
        return sum + fteSum * rEng.capacity;
      }, 0);

      return {
        team: team
          .replace("Endpoint Engineering", "Endpoint")
          .replace("Productivity Apps", "Prod Apps")
          .replace("Infrastructure", "Infra")
          .replace("Service Desk", "Svc Desk"),
        fullTeam: team,
        initiativeFTE: parseFloat(initiativeFTE.toFixed(2)),
        committedFTE: parseFloat(Math.min(committedFTE, initiativeFTE * 2).toFixed(2)),
        totalFTE: cfg.totalFTE,
      };
    });
  }, [projects]);

  const TOOLTIP_STYLE = {
    contentStyle: {
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: 6,
      fontSize: 11,
      fontFamily: "var(--font-sans)",
    },
    labelStyle: { color: "#e2e8f0" },
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Tab bar — underline style */}
      <div className="border-b border-slate-800 px-4 flex items-stretch">
        {(["engineers", "teams"] as TabMode[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-500 text-slate-100"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600"
            }`}
          >
            {t === "engineers" ? "Named Engineers" : "Team Allocation"}
          </button>
        ))}
      </div>

      {tab === "engineers" && (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 bg-slate-900/50">
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Engineer</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Team</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Cap.</th>
                {QUARTERS.map((q) => (
                  <th key={q} className="text-center px-2 py-3 font-semibold uppercase tracking-wide whitespace-nowrap">
                    {q}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engineerStats.map((eng, idx) => (
                <tr
                  key={`${eng.id}-${idx}`}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${
                    eng.isOverloaded ? "bg-orange-950/10" : idx % 2 === 1 ? "bg-slate-800/10" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-slate-200 font-medium">
                    {eng.name}
                    {eng.isOverloaded && (
                      <span className="ml-2 text-amber-400 text-xs font-mono">overloaded</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{eng.team}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{eng.capLabel}</td>
                  {QUARTERS.map((q) => {
                    const val = eng.quarters[q] ?? 0;
                    const color =
                      val === 0
                        ? "text-slate-700"
                        : val > 130
                        ? "text-red-400 font-bold"
                        : val > 100
                        ? "text-amber-400 font-bold"
                        : "text-emerald-400";
                    return (
                      <td key={q} className={`px-2 py-3 text-center font-mono ${color}`}>
                        {val > 0 ? `${val}%` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "teams" && (
        <div className="p-4">
          <div className="text-sm text-slate-500 mb-4">
            Initiative FTE Available vs. Committed (active projects)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamData} barCategoryGap="30%">
              <XAxis
                dataKey="team"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="initiativeFTE" name="Initiative FTE Available" fill="#1e293b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="committedFTE" name="FTE Committed" radius={[3, 3, 0, 0]}>
                {teamData.map((entry, index) => (
                  <RechartsCell
                    key={`cell-${index}`}
                    fill={
                      entry.committedFTE > entry.initiativeFTE
                        ? "#f59e0b"
                        : "#10b981"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-sm text-slate-500 mt-2 justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-slate-700" />Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-emerald-600" />Committed (under)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded bg-amber-500" />Committed (over)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
