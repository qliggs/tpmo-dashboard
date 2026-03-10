"use client";

import { useMemo } from "react";
import { Project } from "@/lib/types";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LabelList,
} from "recharts";

interface Props {
  projects: Project[];
}

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#3b82f6",
};

// emerald = not started, blue = ready to start, orange = in progress, red = blocked
const DONUT_COLORS = ["#475569", "#3b82f6", "#10b981", "#ef4444"];

const CHART_LABEL_COLOR = "#64748b"; // slate-500
const AXIS_VALUE_COLOR = "#94a3b8"; // slate-400

export default function ProgressCharts({ projects }: Props) {
  const quarterData = useMemo(() =>
    QUARTERS.map((q) => {
      const inQ = projects.filter((p) => p.timeline === q);
      const done = inQ.filter((p) => p.status === "In Progress").length;
      return { name: q, total: inQ.length, inProgress: done };
    }),
    [projects]
  );

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const p of projects) {
      if (p.priority && counts[p.priority] !== undefined) counts[p.priority]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      "Not Started": 0,
      "Ready to Start": 0,
      "In Progress": 0,
      "Blocked": 0,
    };
    for (const p of projects) {
      if (p.status && counts[p.status] !== undefined) counts[p.status]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const forecastData = useMemo(() =>
    QUARTERS.map((q) => ({
      name: q,
      forecasted: projects.filter((p) => p.timeline === q).length,
      atRisk: projects.filter((p) => p.timeline === q && p.risks.length > 0).length,
    })),
    [projects]
  );

  const TOOLTIP_STYLE = {
    contentStyle: {
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: 6,
      fontSize: 11,
      fontFamily: "var(--font-sans)",
    },
    labelStyle: { color: "#e2e8f0" },
    itemStyle: { color: AXIS_VALUE_COLOR },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Status Donut */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Portfolio Status
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              dataKey="value"
              paddingAngle={2}
            >
              {statusData.map((entry, idx) => (
                <Cell key={entry.name} fill={DONUT_COLORS[idx]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 13, color: CHART_LABEL_COLOR }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Priority Distribution
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={priorityData} layout="vertical" barCategoryGap="15%">
            <XAxis
              type="number"
              tick={{ fill: CHART_LABEL_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: AXIS_VALUE_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="value" name="Projects" radius={[0, 4, 4, 0]}>
              {priorityData.map((entry) => (
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#334155"} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                style={{ fontSize: 12, fill: AXIS_VALUE_COLOR }}
                formatter={(v) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly Load */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Quarterly Project Load
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={quarterData} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_LABEL_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_LABEL_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="total" name="Total" fill="#1e293b" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="total"
                position="top"
                style={{ fontSize: 11, fill: AXIS_VALUE_COLOR }}
                formatter={(v) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
            <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="inProgress"
                position="top"
                style={{ fontSize: 11, fill: "#3b82f6" }}
                formatter={(v) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast vs At Risk */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          Forecasted Completions vs. At Risk
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={forecastData} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_LABEL_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_LABEL_COLOR, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="forecasted" name="Forecasted" fill="#10b981" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="forecasted"
                position="top"
                style={{ fontSize: 11, fill: "#10b981" }}
                formatter={(v) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
            <Bar dataKey="atRisk" name="At Risk" fill="#ef4444" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="atRisk"
                position="top"
                style={{ fontSize: 11, fill: "#ef4444" }}
                formatter={(v) => (Number(v) > 0 ? String(v) : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
