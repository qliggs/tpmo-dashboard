"use client";

import { useState, useMemo } from "react";
import { CapacityCell, CapacityPayload } from "@/lib/types";
import { indexColorClass, deltaColorClass } from "@/lib/capacityIndex";

type ViewMode = "baseline" | "live" | "delta";

interface Props {
  data: CapacityPayload;
}

function Tooltip({ cell, mode }: { cell: CapacityCell; mode: ViewMode }) {
  void mode;
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs shadow-xl pointer-events-none">
      <div className="font-semibold text-slate-200 mb-2">
        {cell.team} — {cell.month}
      </div>
      <div className="text-slate-400 mb-1">
        Baseline: <span className="text-slate-200 font-mono">{cell.baselineIndex}</span>
      </div>
      <div className="text-slate-400 mb-1">
        Live: <span className="text-slate-200 font-mono">{cell.liveIndex}</span>
      </div>
      <div className="text-slate-400 mb-2">
        Delta:{" "}
        <span className={`font-mono font-bold ${cell.delta >= 0 ? "text-amber-400" : "text-blue-400"}`}>
          {cell.delta >= 0 ? "+" : ""}
          {cell.delta}
        </span>
      </div>
      <div className="text-slate-400 mb-1">
        Initiative FTE:{" "}
        <span className="font-mono">{cell.initiativeFTECommitted.toFixed(2)} / {cell.initiativeFTEAvailable.toFixed(2)}</span>
      </div>
      {cell.contributors.length > 0 && (
        <div className="mt-2 border-t border-slate-700 pt-2">
          <div className="text-slate-500 mb-1">Contributing projects:</div>
          {cell.contributors.map((c) => (
            <div key={c.projectId} className="mb-1">
              <span className="text-slate-300">{c.projectName}</span>
              <div className="ml-2 text-slate-500">
                {c.engineers.map((e) => `${e.name} (${e.fte}FTE)`).join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({ cell, mode }: { cell: CapacityCell; mode: ViewMode }) {
  const [hovered, setHovered] = useState(false);

  const value =
    mode === "baseline"
      ? cell.baselineIndex
      : mode === "live"
      ? cell.liveIndex
      : cell.delta;

  const colorClass =
    mode === "delta"
      ? deltaColorClass(cell.delta)
      : indexColorClass(value);

  const displayValue = mode === "delta" && cell.delta >= 0 ? `+${value}` : String(value);

  return (
    <div
      className={`relative w-16 h-12 flex items-center justify-center text-xs font-bold font-mono rounded-md cursor-default select-none ${colorClass}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {displayValue}
      {hovered && <Tooltip cell={cell} mode={mode} />}
    </div>
  );
}

export default function CapacityHeatmap({ data }: Props) {
  const [mode, setMode] = useState<ViewMode>("baseline");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const cellMap = useMemo(() => {
    const map: Record<string, Record<string, CapacityCell>> = {};
    for (const cell of data.cells) {
      if (!map[cell.team]) map[cell.team] = {};
      map[cell.team][cell.month] = cell;
    }
    return map;
  }, [data.cells]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header with segmented control */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-4">
        <span className="text-sm font-semibold text-slate-300">
          Capacity Index — Armon&apos;s Model
        </span>
        {/* Segmented control */}
        <div className="flex gap-0 bg-slate-800 border border-slate-700 rounded-md p-0.5 ml-auto">
          {(["baseline", "live", "delta"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1 rounded text-xs font-semibold transition-all capitalize ${
                mode === m
                  ? "bg-slate-600 text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin p-4">
        <table className="border-separate border-spacing-1">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="text-left text-xs text-slate-500 font-semibold w-44 pr-4 bg-slate-900">
                Team
              </th>
              {data.months.map((m) => (
                <th
                  key={m}
                  className={`text-xs font-semibold w-16 text-center bg-slate-900 ${
                    m === currentMonth
                      ? "text-blue-400"
                      : "text-slate-500"
                  }`}
                >
                  {m.slice(5)}
                  {m === currentMonth && (
                    <span className="block w-1 h-1 rounded-full bg-blue-500 mx-auto mt-0.5" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team, teamIdx) => (
              <tr key={team} className={teamIdx % 2 === 1 ? "bg-slate-800/10" : ""}>
                <td className="text-xs text-slate-400 pr-4 whitespace-nowrap font-medium">
                  {team}
                </td>
                {data.months.map((month) => {
                  const cell = cellMap[team]?.[month];
                  if (!cell) {
                    return (
                      <td key={month}>
                        <div className="w-16 h-12 bg-slate-800/50 rounded-md" />
                      </td>
                    );
                  }
                  return (
                    <td key={month} className="relative">
                      <Cell cell={cell} mode={mode} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color scale legend */}
      <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {mode !== "delta" ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-700" />0 — No work
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-900" />1–79 — Under capacity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-800" />80–100 — Approaching full
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-700" />101–130 — Over (warning)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-700" />&gt;130 — Over (critical)
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-900" />Lighter than baseline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-700" />Near zero (±10)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-800" />Heavier than baseline
            </span>
          </>
        )}
      </div>
    </div>
  );
}
