"use client";

import { useMemo } from "react";
import { Project } from "@/lib/types";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
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

const DONUT_COLORS = ["#16a34a", "#3b82f6", "#f97316", "#ef4444"];

export default function ProgressCharts({ projects }: Props) {
  // Portfolio completion by quarter
  const quarterData = useMemo(() =>
    QUARTERS.map((q) => {
      const inQ = projects.filter((p) => p.timeline === q);
      const done = inQ.filter((p) => p.status === "In Progress").length; // proxy
      return { name: q, total: inQ.length, inProgress: done };
    }),
    [projects]
  );

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const p of projects) {
      if (p.priority && counts[p.priority] !== undefined) counts[p.priority]++;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Status donut
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

  // Forecasted completions by quarter
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
      background: "#18181b",
      border: "1px solid #3f3f46",
      borderRadius: 6,
      fontSize: 11,
    },
    labelStyle: { color: "#e4e4e7" },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Status Donut */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-xs font-semibold text-zinc-300 mb-4">Portfolio Status</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
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
              wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Distribution */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-xs font-semibold text-zinc-300 mb-4">Priority Distribution</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={priorityData} layout="vertical" barCategoryGap="25%">
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="value" name="Projects" radius={[0, 3, 3, 0]}>
              {priorityData.map((entry) => (
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#3f3f46"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly Load */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-xs font-semibold text-zinc-300 mb-4">Quarterly Project Load</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={quarterData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="total" name="Total" fill="#3f3f46" radius={[3, 3, 0, 0]} />
            <Bar dataKey="inProgress" name="In Progress" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast vs At Risk */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-xs font-semibold text-zinc-300 mb-4">Forecasted Completions vs. At Risk</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={forecastData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="forecasted" name="Forecasted" fill="#16a34a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="atRisk" name="At Risk" fill="#ea580c" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
