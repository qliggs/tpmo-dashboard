"use client";

import { useState, useMemo } from "react";
import { Project, RiskFlag, RiskSeverity, RiskType } from "@/lib/types";

interface Props {
  projects: Project[];
}

interface RiskRow {
  project: string;
  projectId: string;
  risk: RiskFlag;
  timeline: string;
  team?: string;
}

const SEVERITY_BADGE: Record<RiskSeverity, string> = {
  warning: "bg-yellow-900 text-yellow-300 border-yellow-700",
  critical: "bg-red-900 text-red-300 border-red-700",
};

const TYPE_LABEL: Record<RiskType, string> = {
  TIMELINE_SLIP: "Timeline Slip",
  ENGINEER_OVERALLOCATION: "Overallocation",
  CASCADE_DELAY: "Cascade Delay",
  END_DATE_SLIP: "End Date Slip",
};

export default function RiskRegister({ projects }: Props) {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const rows = useMemo<RiskRow[]>(() => {
    const result: RiskRow[] = [];
    for (const p of projects) {
      for (const r of p.risks) {
        result.push({
          project: p.initiative,
          projectId: p.id,
          risk: r,
          timeline: p.timeline ?? "—",
        });
      }
    }
    return result;
  }, [projects]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filterSeverity !== "all" && row.risk.severity !== filterSeverity) return false;
      if (filterType !== "all" && row.risk.type !== filterType) return false;
      return true;
    });
  }, [rows, filterSeverity, filterType]);

  const criticalCount = rows.filter((r) => r.risk.severity === "critical").length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-300">Risk Register</span>
          <span className="ml-2 text-xs text-zinc-500">
            {rows.length} flags ({criticalCount} critical)
          </span>
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
          >
            <option value="all">All Types</option>
            <option value="TIMELINE_SLIP">Timeline Slip</option>
            <option value="ENGINEER_OVERALLOCATION">Overallocation</option>
            <option value="CASCADE_DELAY">Cascade Delay</option>
            <option value="END_DATE_SLIP">End Date Slip</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-xs text-zinc-500 text-center">
          {rows.length === 0 ? "No risks detected" : "No risks match filters"}
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left px-4 py-2 font-medium">Project</th>
                <th className="text-left px-4 py-2 font-medium">Risk Type</th>
                <th className="text-left px-4 py-2 font-medium">Severity</th>
                <th className="text-left px-4 py-2 font-medium">Reason</th>
                <th className="text-left px-4 py-2 font-medium">Engineer</th>
                <th className="text-left px-4 py-2 font-medium w-56">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={`${row.projectId}-${idx}`}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3 text-zinc-200 font-medium max-w-40">
                    <div className="truncate">{row.project}</div>
                    <div className="text-zinc-500 text-xs">{row.timeline}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {TYPE_LABEL[row.risk.type]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border font-medium ${
                        SEVERITY_BADGE[row.risk.severity]
                      }`}
                    >
                      {row.risk.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 max-w-xs">
                    <div className="line-clamp-2">{row.risk.reason}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {row.risk.affectedEngineer ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 max-w-xs">
                    <div className="line-clamp-3">{row.risk.recommendedAction}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
