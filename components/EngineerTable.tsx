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

  // Build per-engineer, per-quarter active project count
  const engineerStats = useMemo(() => {
    return engineers.map((eng) => {
      const quarters: Record<string, number> = {};
      for (const q of QUARTERS) {
        const active = projects.filter(
          (p) =>
            p.timeline === q &&
            (p.engineerNames.includes(eng.name) || p.engineerIds.includes(eng.id))
        );
        // Each project = allocationPct usage
        quarters[q] = Math.round(active.length * eng.allocationPct);
      }
      const isOverloaded = Object.values(quarters).some((v) => v > 100);
      return { ...eng, quarters, isOverloaded };
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
      // Count active projects' engineer FTE for this team
      const committedFTE = ENGINEERS.filter((e) => e.team === team).reduce((sum, rEng) => {
        const activeForEng = projects.filter(
          (p) =>
            p.status &&
            ["In Progress", "Ready to Start"].includes(p.status) &&
            p.engineerNames.includes(rEng.name)
        );
        return sum + activeForEng.length * rEng.capacity;
      }, 0);

      return {
        team: team.replace("Endpoint Engineering", "Endpoint").replace("Productivity Apps", "Prod Apps").replace("Infrastructure", "Infra").replace("Service Desk", "Svc Desk"),
        fullTeam: team,
        initiativeFTE: parseFloat(initiativeFTE.toFixed(2)),
        committedFTE: parseFloat(Math.min(committedFTE, initiativeFTE * 2).toFixed(2)),
        totalFTE: cfg.totalFTE,
      };
    });
  }, [projects]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-4">
        <div className="flex gap-1">
          {(["engineers", "teams"] as TabMode[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-zinc-600 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {t === "engineers" ? "Named Engineers" : "Team Allocation"}
            </button>
          ))}
        </div>
      </div>

      {tab === "engineers" && (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left px-4 py-2 font-medium">Engineer</th>
                <th className="text-left px-4 py-2 font-medium">Team</th>
                <th className="text-left px-4 py-2 font-medium">Capacity</th>
                {QUARTERS.map((q) => (
                  <th key={q} className="text-center px-2 py-2 font-medium">{q}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engineerStats.map((eng, idx) => (
                <tr
                  key={`${eng.id}-${idx}`}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 ${
                    eng.isOverloaded ? "bg-orange-950/20" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-zinc-200 font-medium">
                    {eng.name}
                    {eng.isOverloaded && (
                      <span className="ml-2 text-orange-400 text-xs">overloaded</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-zinc-400">{eng.team}</td>
                  <td className="px-4 py-2 text-zinc-400">{eng.allocationPct}%</td>
                  {QUARTERS.map((q) => {
                    const val = eng.quarters[q] ?? 0;
                    const color =
                      val === 0
                        ? "text-zinc-600"
                        : val > 130
                        ? "text-red-400 font-bold"
                        : val > 100
                        ? "text-orange-400 font-bold"
                        : "text-green-400";
                    return (
                      <td key={q} className={`px-2 py-2 text-center ${color}`}>
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
          <div className="text-xs text-zinc-500 mb-4">
            Initiative FTE Available vs. Committed (active projects)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={teamData} barCategoryGap="30%">
              <XAxis
                dataKey="team"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <Bar dataKey="initiativeFTE" name="Initiative FTE Available" fill="#3f3f46" radius={[3, 3, 0, 0]} />
              <Bar dataKey="committedFTE" name="FTE Committed" radius={[3, 3, 0, 0]}>
                {teamData.map((entry, index) => (
                  <RechartsCell
                    key={`cell-${index}`}
                    fill={
                      entry.committedFTE > entry.initiativeFTE
                        ? "#ea580c"
                        : "#16a34a"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs text-zinc-500 mt-2 justify-center">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-zinc-600" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-green-700" />Committed (under)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-orange-600" />Committed (over)</span>
          </div>
        </div>
      )}
    </div>
  );
}
