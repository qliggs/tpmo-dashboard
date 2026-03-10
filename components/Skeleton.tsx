/** Reusable skeleton shimmer primitives for loading states */
import React from "react";

function Shimmer({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-zinc-800 rounded ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/** 6-card KPI summary skeleton */
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded border border-zinc-700/50 bg-zinc-900 p-4 space-y-3">
          <Shimmer className="h-3 w-2/3" />
          <Shimmer className="h-7 w-1/2" />
          <Shimmer className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/** Gantt chart skeleton */
export function GanttSkeleton() {
  return (
    <div className="rounded border border-zinc-700/50 bg-zinc-900 p-4 space-y-3">
      {/* header */}
      <div className="flex gap-4 mb-4">
        <Shimmer className="h-8 w-36" />
        <Shimmer className="h-8 w-36" />
        <Shimmer className="h-8 w-28 ml-auto" />
      </div>
      {/* week labels */}
      <Shimmer className="h-4 w-full" />
      {/* rows */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Shimmer className="h-5 w-36 flex-shrink-0" />
          <Shimmer
            className="h-5 rounded-sm"
            style={{ width: `${20 + Math.random() * 50}%` }}
          />
        </div>
      ))}
    </div>
  );
}

/** Table rows skeleton */
export function TableSkeleton({ rows = 10, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded border border-zinc-700/50 bg-zinc-900 overflow-hidden">
      {/* header */}
      <div className="flex gap-4 p-3 border-b border-zinc-700/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-zinc-700/20">
          {Array.from({ length: cols }).map((_, j) => (
            <Shimmer key={j} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Heatmap skeleton */
export function HeatmapSkeleton() {
  return (
    <div className="rounded border border-zinc-700/50 bg-zinc-900 p-4 space-y-3">
      <Shimmer className="h-4 w-48 mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }).map((_, i) => (
          <Shimmer key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

/** Full-page loading layout with labelled section */
export function PageLoadingSkeleton({
  sections,
}: {
  sections: ("summary" | "gantt" | "table" | "heatmap")[];
}) {
  return (
    <div className="space-y-6 p-6">
      {sections.map((s, i) => {
        if (s === "summary") return <SummaryCardsSkeleton key={i} />;
        if (s === "gantt") return <GanttSkeleton key={i} />;
        if (s === "heatmap") return <HeatmapSkeleton key={i} />;
        return <TableSkeleton key={i} />;
      })}
    </div>
  );
}
