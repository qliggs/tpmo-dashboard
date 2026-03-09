"use client";

import { useState, useMemo } from "react";
import { CapacityCell, CapacityPayload } from "@/lib/types";
import { indexColorClass, deltaColorClass } from "@/lib/capacityIndex";

type ViewMode = "baseline" | "live" | "delta";

interface Props {
  data: CapacityPayload;
}

function Tooltip({ cell, mode }: { cell: CapacityCell; mode: ViewMode }) {
  const value =
    mode === "baseline"
      ? cell.baselineIndex
      : mode === "live"
      ? cell.liveIndex
      : cell.delta;

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-zinc-800 border border-zinc-700 rounded p-3 text-xs shadow-xl pointer-events-none">
      <div className="font-semibold text-zinc-200 mb-2">
        {cell.team} — {cell.month}
      </div>
      <div className="text-zinc-400 mb-1">
        Baseline: <span className="text-zinc-200">{cell.baselineIndex}</span>
      </div>
      <div className="text-zinc-400 mb-1">
        Live: <span className="text-zinc-200">{cell.liveIndex}</span>
      </div>
      <div className="text-zinc-400 mb-2">
        Delta: <span className={cell.delta >= 0 ? "text-orange-400" : "text-blue-400"}>{cell.delta >= 0 ? "+" : ""}{cell.delta}</span>
      </div>
      <div className="text-zinc-400 mb-1">
        Initiative FTE: {cell.initiativeFTECommitted.toFixed(2)} / {cell.initiativeFTEAvailable.toFixed(2)}
      </div>
      {cell.contributors.length > 0 && (
        <div className="mt-2 border-t border-zinc-700 pt-2">
          <div className="text-zinc-500 mb-1">Contributing projects:</div>
          {cell.contributors.map((c) => (
            <div key={c.projectId} className="mb-1">
              <span className="text-zinc-300">{c.projectName}</span>
              <div className="ml-2 text-zinc-500">
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
      className={`relative w-14 h-10 flex items-center justify-center text-xs font-semibold rounded cursor-default select-none ${colorClass}`}
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-4">
        <span className="text-xs font-semibold text-zinc-300">
          Capacity Index — Armon&apos;s Model
        </span>
        <div className="flex gap-1 ml-auto">
          {(["baseline", "live", "delta"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                mode === m
                  ? "bg-zinc-600 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin p-4">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-xs text-zinc-500 font-medium w-40 pr-4">Team</th>
              {data.months.map((m) => (
                <th
                  key={m}
                  className={`text-xs font-medium w-14 text-center ${
                    m === currentMonth ? "text-blue-400" : "text-zinc-500"
                  }`}
                >
                  {m.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team) => (
              <tr key={team}>
                <td className="text-xs text-zinc-400 pr-4 whitespace-nowrap font-medium">
                  {team}
                </td>
                {data.months.map((month) => {
                  const cell = cellMap[team]?.[month];
                  if (!cell) {
                    return <td key={month}><div className="w-14 h-10 bg-zinc-800 rounded" /></td>;
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
      <div className="px-4 pb-4 flex flex-wrap gap-3 text-xs text-zinc-500">
        {mode !== "delta" ? (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-700" />0 — No work</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-900" />1–79 — Under capacity</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-800" />80–100 — Approaching full</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-700" />101–130 — Over (warning)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-700" />&gt;130 — Over (critical)</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-900" />Lighter than baseline</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-700" />Near zero (±10)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-800" />Heavier than baseline</span>
          </>
        )}
      </div>
    </div>
  );
}
