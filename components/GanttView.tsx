"use client";

import { useState, useMemo } from "react";
import { Project } from "@/lib/types";

type ViewMode = "date" | "initiative" | "quarter" | "h1" | "h2" | "annual";

interface Props {
  projects: Project[];
}

const STATUS_COLORS: Record<string, string> = {
  "In Progress": "bg-blue-600",
  "Ready to Start": "bg-green-700",
  "Not Started": "bg-zinc-600",
  "Blocked": "bg-red-700",
};

const PRIORITY_DOT: Record<string, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-500",
  Medium: "bg-yellow-500",
  Low: "bg-blue-500",
};

const QUARTER_ORDER = [
  "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026",
  "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027",
];

const HALF_YEAR_ORDER = [
  "H1 2026", "H2 2026",
  "H1 2027", "H2 2027",
];

// Which quarters fall in each half
const H1_QUARTERS = new Set(["Q1 2026", "Q2 2026", "Q1 2027", "Q2 2027"]);
const H2_QUARTERS = new Set(["Q3 2026", "Q4 2026", "Q3 2027", "Q4 2027"]);

function timelineToHalfYear(timeline: string | null | undefined): string {
  if (!timeline) return "Unscheduled";
  const m = timeline.match(/^Q(\d)\s+(\d{4})$/);
  if (!m) return "Unscheduled";
  return parseInt(m[1]) <= 2 ? `H1 ${m[2]}` : `H2 ${m[2]}`;
}

function getWeeksBetween(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)));
}

function getWeeksFromChartStart(date: Date, chartStart: Date): number {
  return Math.max(0, Math.floor((date.getTime() - chartStart.getTime()) / (7 * 86400000)));
}

const VIEW_LABELS: Record<ViewMode, string> = {
  date: "By Date",
  initiative: "By Initiative",
  quarter: "By Quarter",
  h1: "By H1",
  h2: "By H2",
  annual: "By Annual",
};

const TITLE_LABELS: Record<ViewMode, string> = {
  date: "Rolling 9 Months",
  initiative: "By Initiative",
  quarter: "By Quarter",
  h1: "H1 — Jan to Jun",
  h2: "H2 — Jul to Dec",
  annual: `Full Year ${new Date().getFullYear()}`,
};

export default function GanttView({ projects }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("date");
  const [filterQuarter, setFilterQuarter] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Rolling 9-month chart: starts at current quarter
  const rollingChartStart = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const qStartMonth = month < 3 ? 0 : month < 6 ? 3 : month < 9 ? 6 : 9;
    return new Date(now.getFullYear(), qStartMonth, 1);
  }, []);

  // Annual chart: Jan 1 of current year
  const annualChartStart = useMemo(() => new Date(new Date().getFullYear(), 0, 1), []);

  const activeChartStart = viewMode === "annual" ? annualChartStart : rollingChartStart;
  const activeTotalWeeks = viewMode === "annual" ? 52 : 39;

  const WEEK_PX = 18;

  // Filter logic — Period filter supports H1, H2, and Annual multi-quarter ranges
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filterQuarter !== "all") {
        const tl = p.timeline ?? "";
        if (filterQuarter === "H1 2026") {
          if (!["Q1 2026", "Q2 2026"].includes(tl)) return false;
        } else if (filterQuarter === "H2 2026") {
          if (!["Q3 2026", "Q4 2026"].includes(tl)) return false;
        } else if (filterQuarter === "Annual 2026") {
          if (!["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"].includes(tl)) return false;
        } else {
          if (tl !== filterQuarter) return false;
        }
      }
      if (filterPriority !== "all" && p.priority !== filterPriority) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [projects, filterQuarter, filterPriority, filterStatus]);

  // Build groups based on view mode
  const groups = useMemo((): { header: string | null; rows: Project[]; bold?: boolean }[] => {
    const byDate = (a: Project, b: Project) => a.startDate.localeCompare(b.startDate);

    if (viewMode === "date") {
      return [{ header: null, rows: [...filtered].sort(byDate) }];
    }

    if (viewMode === "initiative") {
      const map = new Map<string, Project[]>();
      for (const p of filtered) {
        if (!map.has(p.initiative)) map.set(p.initiative, []);
        map.get(p.initiative)!.push(p);
      }
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([header, rows]) => ({ header, rows: rows.sort(byDate) }));
    }

    if (viewMode === "annual") {
      const map = new Map<string, Project[]>();
      for (const p of filtered) {
        if (!map.has(p.initiative)) map.set(p.initiative, []);
        map.get(p.initiative)!.push(p);
      }
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([header, rows]) => ({ header, rows: rows.sort(byDate), bold: true }));
    }

    if (viewMode === "quarter") {
      const map = new Map<string, Project[]>();
      for (const p of filtered) {
        const key = p.timeline ?? "Unscheduled";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
      const orderedKeys = QUARTER_ORDER.filter((q) => map.has(q));
      const unordered = [...map.keys()].filter((k) => !QUARTER_ORDER.includes(k));
      return [...orderedKeys, ...unordered].map((header) => ({
        header,
        rows: (map.get(header) ?? []).sort(byDate),
      }));
    }

    // h1 or h2: implicit filter to the relevant half, then group by half-year label
    const targetSet = viewMode === "h1" ? H1_QUARTERS : H2_QUARTERS;
    const halfProjects = filtered.filter((p) => targetSet.has(p.timeline ?? ""));
    const map = new Map<string, Project[]>();
    for (const p of halfProjects) {
      const key = timelineToHalfYear(p.timeline);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const prefix = viewMode === "h1" ? "H1" : "H2";
    const orderedKeys = HALF_YEAR_ORDER.filter((h) => h.startsWith(prefix) && map.has(h));
    return orderedKeys.map((header) => ({
      header,
      rows: (map.get(header) ?? []).sort(byDate),
    }));
  }, [filtered, viewMode]);

  const totalVisible = groups.reduce((sum, g) => sum + g.rows.length, 0);

  // Week labels for the timeline header
  const weekLabels = useMemo(() => {
    const labels: { label: string; week: number }[] = [];
    for (let w = 0; w < activeTotalWeeks; w += 4) {
      const d = new Date(activeChartStart);
      d.setDate(d.getDate() + w * 7);
      labels.push({
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        week: w,
      });
    }
    return labels;
  }, [activeChartStart, activeTotalWeeks]);

  const todayOffset = getWeeksFromChartStart(new Date(), activeChartStart);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex flex-wrap gap-3 items-center">
        <span className="text-xs font-semibold text-zinc-300">
          Gantt — {TITLE_LABELS[viewMode]}
        </span>

        {/* View mode toggle */}
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === m
                  ? "bg-zinc-600 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {VIEW_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto flex-wrap">
          {[
            {
              label: "Period",
              value: filterQuarter,
              setter: setFilterQuarter,
              options: [
                "all",
                "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026",
                "H1 2026", "H2 2026",
                "Annual 2026",
              ],
            },
            {
              label: "Priority",
              value: filterPriority,
              setter: setFilterPriority,
              options: ["all", "Critical", "High", "Medium", "Low"],
            },
            {
              label: "Status",
              value: filterStatus,
              setter: setFilterStatus,
              options: ["all", "Not Started", "Ready to Start", "In Progress", "Blocked"],
            },
          ].map(({ label, value, setter, options }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
            >
              {options.map((o) => (
                <option key={o} value={o}>
                  {o === "all" ? `All ${label}s` : o}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: `${300 + activeTotalWeeks * WEEK_PX}px` }}>
          {/* Timeline header row */}
          <div className="flex border-b border-zinc-800 bg-zinc-950">
            <div className="w-72 shrink-0 px-3 py-2 text-xs text-zinc-500 font-medium border-r border-zinc-800">
              Initiative
            </div>
            <div className="flex-1 relative h-8">
              {weekLabels.map(({ label, week }) => (
                <span
                  key={week}
                  className="absolute top-2 text-xs text-zinc-600 whitespace-nowrap"
                  style={{ left: `${week * WEEK_PX}px` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {totalVisible === 0 && (
            <div className="px-4 py-8 text-xs text-zinc-500 text-center">
              No projects match filters
            </div>
          )}

          {groups.map(({ header, rows, bold }, gi) => (
            <div key={header ?? `group-${gi}`}>
              {/* Group header row */}
              {header && (
                <div
                  className={`flex border-b sticky top-0 z-10 ${
                    bold
                      ? "border-blue-500/20 bg-zinc-800"
                      : "border-zinc-700 bg-zinc-800/60"
                  }`}
                >
                  <div
                    className={`w-72 shrink-0 px-3 border-r border-zinc-700 flex items-center gap-2 ${
                      bold ? "py-2" : "py-1.5"
                    }`}
                  >
                    {bold && (
                      <span className="w-0.5 h-4 rounded-full bg-blue-500 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        bold
                          ? "text-sm font-bold text-zinc-100"
                          : "text-xs font-semibold text-zinc-300 tracking-wide"
                      }`}
                    >
                      {header}
                    </span>
                    <span className={`${bold ? "ml-auto" : "ml-2"} text-xs text-zinc-500 shrink-0`}>
                      ({rows.length})
                    </span>
                  </div>
                  <div
                    className="flex-1 relative"
                    style={{ minWidth: `${activeTotalWeeks * WEEK_PX}px` }}
                  >
                    <div
                      className="absolute top-0 bottom-0 w-px bg-blue-500/30 pointer-events-none"
                      style={{ left: `${todayOffset * WEEK_PX}px` }}
                    />
                  </div>
                </div>
              )}

              {/* Project rows */}
              {rows.map((project) => {
                const start = new Date(project.startDate);
                const end = new Date(project.cascadeDelay?.newEnd ?? project.endDate);
                const origStart = project.cascadeDelay
                  ? new Date(project.cascadeDelay.originalStart)
                  : null;

                const barStart = getWeeksFromChartStart(start, activeChartStart);
                const barWidth = getWeeksBetween(start, end);
                const origBarStart = origStart
                  ? getWeeksFromChartStart(origStart, activeChartStart)
                  : null;
                const origBarWidth = origStart
                  ? Math.max(1, getWeeksFromChartStart(start, origStart))
                  : null;

                const isAtRisk = project.risks.length > 0;
                const statusColor = STATUS_COLORS[project.status ?? "Not Started"] ?? "bg-zinc-600";
                const priorityDot = PRIORITY_DOT[project.priority ?? "Low"] ?? "bg-zinc-500";

                return (
                  <div
                    key={project.id}
                    className="flex border-b border-zinc-800/50 hover:bg-zinc-800/30 group"
                  >
                    {/* Label */}
                    <div className="w-72 shrink-0 px-3 py-2 border-r border-zinc-800 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot}`} />
                      <div className="min-w-0">
                        <div className="text-xs text-zinc-200 truncate">{project.initiative}</div>
                        <div className="text-xs text-zinc-500 truncate">{project.status}</div>
                      </div>
                      {isAtRisk && (
                        <span className="ml-auto text-xs text-red-400 shrink-0">!</span>
                      )}
                    </div>

                    {/* Bar area */}
                    <div
                      className="flex-1 relative h-10"
                      style={{ minWidth: `${activeTotalWeeks * WEEK_PX}px` }}
                    >
                      {/* Ghost bar for cascade delay */}
                      {origBarStart !== null && origBarWidth !== null && (
                        <div
                          className="absolute top-3 h-4 rounded bg-zinc-700/40 border border-dashed border-zinc-600"
                          style={{
                            left: `${origBarStart * WEEK_PX}px`,
                            width: `${origBarWidth * WEEK_PX}px`,
                          }}
                        />
                      )}

                      {/* Main bar */}
                      <div
                        className={`absolute top-3 h-4 rounded ${statusColor} ${isAtRisk ? "ring-1 ring-orange-500/60" : ""} flex items-center px-1`}
                        style={{
                          left: `${barStart * WEEK_PX}px`,
                          width: `${Math.max(barWidth, 1) * WEEK_PX}px`,
                        }}
                        title={`${project.initiative}\nDeliverable: ${project.deliverable}\n${project.startDate} → ${project.endDate}\n${project.engineerNames.join(", ")}`}
                      >
                        <span className="text-xs text-white/80 truncate">
                          {project.deliverable || project.initiative}
                        </span>
                      </div>

                      {/* Today marker */}
                      <div
                        className="absolute top-0 bottom-0 w-px bg-blue-500/50 pointer-events-none"
                        style={{ left: `${todayOffset * WEEK_PX}px` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-500">
        {Object.entries(STATUS_COLORS).map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-2 rounded ${cls}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded border border-dashed border-zinc-600 bg-zinc-700/40" />
          Cascade (original)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded ring-1 ring-orange-500/60 bg-zinc-600" />
          At Risk
        </span>
      </div>
    </div>
  );
}
