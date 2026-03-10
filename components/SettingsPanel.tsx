"use client";

import { useEffect, useState } from "react";
import {
  useSettings,
  DEFAULT_SETTINGS,
  SIZE_KEYS,
  SizeConfig,
  ThresholdConfig,
  DisplayConfig,
  GanttDefaultView,
} from "@/lib/settingsContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

type TabId = "sizes" | "thresholds" | "display";

const GANTT_VIEWS: { value: GanttDefaultView; label: string }[] = [
  { value: "date", label: "By Date" },
  { value: "initiative", label: "By Initiative" },
  { value: "quarter", label: "By Quarter" },
  { value: "h1", label: "H1" },
  { value: "h2", label: "H2" },
  { value: "annual", label: "Annual" },
];

export default function SettingsPanel({ open, onClose }: Props) {
  const { settings, updateSettings, resetSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<TabId>("sizes");

  // Local state per section — synced from context when panel opens
  const [localSizes, setLocalSizes] = useState<SizeConfig>(settings.sizeWeeks);
  const [localThresholds, setLocalThresholds] = useState<ThresholdConfig>(
    settings.thresholds
  );
  const [localDisplay, setLocalDisplay] = useState<DisplayConfig>(
    settings.display
  );

  // Sync local state when panel opens or context changes
  useEffect(() => {
    if (open) {
      setLocalSizes(settings.sizeWeeks);
      setLocalThresholds(settings.thresholds);
      setLocalDisplay(settings.display);
    }
  }, [open, settings]);

  const handleSaveSizes = () => {
    updateSettings({ sizeWeeks: localSizes });
  };

  const handleSaveThresholds = () => {
    updateSettings({ thresholds: localThresholds });
  };

  const handleSaveDisplay = () => {
    updateSettings({ display: localDisplay });
  };

  const handleReset = () => {
    resetSettings();
    setLocalSizes(DEFAULT_SETTINGS.sizeWeeks);
    setLocalThresholds(DEFAULT_SETTINGS.thresholds);
    setLocalDisplay(DEFAULT_SETTINGS.display);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "sizes", label: "T-shirt Sizes" },
    { id: "thresholds", label: "Risk Thresholds" },
    { id: "display", label: "Display" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard settings"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold text-slate-100 tracking-wide">
            Dashboard Settings
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-800 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-2 py-2.5 text-xs font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? "border-blue-500 text-slate-100"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* ── T-shirt Sizes ─────────────────────────────── */}
          {activeTab === "sizes" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Duration (weeks) assigned when a project has this T-shirt size
                and no explicit End Date. Changes take effect on next data
                refresh.
              </p>
              <div className="space-y-3">
                {SIZE_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-8">
                      {key}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={104}
                      value={localSizes[key]}
                      onChange={(e) =>
                        setLocalSizes((prev) => ({
                          ...prev,
                          [key]: Math.max(1, Number(e.target.value)),
                        }))
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-600">weeks</span>
                    <span className="text-xs text-slate-600 ml-auto">
                      (default: {DEFAULT_SETTINGS.sizeWeeks[key]}w)
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSaveSizes}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded transition-colors"
              >
                Save sizes
              </button>
            </div>
          )}

          {/* ── Risk Thresholds ───────────────────────────── */}
          {activeTab === "thresholds" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Thresholds used to flag engineer overallocation risk badges and
                the At-Risk count.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Overallocation — Warning (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={200}
                      value={localThresholds.overallocWarn}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          overallocWarn: Math.max(50, Number(e.target.value)),
                        }))
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-600">
                      (default: {DEFAULT_SETTINGS.thresholds.overallocWarn}%)
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Overallocation — Critical (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={50}
                      max={300}
                      value={localThresholds.overallocCrit}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          overallocCrit: Math.max(50, Number(e.target.value)),
                        }))
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-600">
                      (default: {DEFAULT_SETTINGS.thresholds.overallocCrit}%)
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    ETA Slip — Warning (days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={localThresholds.etaSlipDays}
                      onChange={(e) =>
                        setLocalThresholds((prev) => ({
                          ...prev,
                          etaSlipDays: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-xs text-slate-600">
                      (default: {DEFAULT_SETTINGS.thresholds.etaSlipDays}d)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSaveThresholds}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded transition-colors"
              >
                Save thresholds
              </button>
            </div>
          )}

          {/* ── Display ───────────────────────────────────── */}
          {activeTab === "display" && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Controls visibility and default state of Gantt and list views.
              </p>

              {/* Toggle: Show Archived */}
              <Toggle
                label="Show archived projects"
                description="Archived and Cancelled projects are hidden by default"
                checked={localDisplay.showArchived}
                onChange={(v) =>
                  setLocalDisplay((prev) => ({ ...prev, showArchived: v }))
                }
              />

              {/* Toggle: Show Not Started in Gantt */}
              <Toggle
                label="Show Not Started in Gantt"
                description='Include "Not Started" projects on the Gantt chart'
                checked={localDisplay.showNotStarted}
                onChange={(v) =>
                  setLocalDisplay((prev) => ({ ...prev, showNotStarted: v }))
                }
              />

              {/* Toggle: Show cascade ghost bars */}
              <Toggle
                label="Show cascade ghost bars"
                description="Display dashed ghost bars for cascade-delayed original start dates"
                checked={localDisplay.showCascadeGhost}
                onChange={(v) =>
                  setLocalDisplay((prev) => ({
                    ...prev,
                    showCascadeGhost: v,
                  }))
                }
              />

              {/* Default Gantt view */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Default Gantt view
                </label>
                <select
                  value={localDisplay.defaultGanttView}
                  onChange={(e) =>
                    setLocalDisplay((prev) => ({
                      ...prev,
                      defaultGanttView: e.target.value as GanttDefaultView,
                    }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {GANTT_VIEWS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveDisplay}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded transition-colors"
              >
                Save display preferences
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-600">Changes are saved immediately</span>
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reusable toggle
// ---------------------------------------------------------------------------

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? "bg-blue-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <div className="min-w-0">
        <span className="block text-xs text-slate-300 font-medium">{label}</span>
        {description && (
          <span className="block text-xs text-slate-600 mt-0.5">{description}</span>
        )}
      </div>
    </div>
  );
}
