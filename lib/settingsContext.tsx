"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { TShirtSize } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SizeConfig {
  S: number;
  M: number;
  L: number;
  XL: number;
  XXL: number;
}

export interface ThresholdConfig {
  /** Overallocation warning threshold — percent (default 100) */
  overallocWarn: number;
  /** Overallocation critical threshold — percent (default 130) */
  overallocCrit: number;
  /** ETA slip warning — days beyond original end date (default 14) */
  etaSlipDays: number;
}

export type GanttDefaultView =
  | "date"
  | "initiative"
  | "quarter"
  | "h1"
  | "h2"
  | "annual";

export interface DisplayConfig {
  showArchived: boolean;
  showNotStarted: boolean;
  showCascadeGhost: boolean;
  defaultGanttView: GanttDefaultView;
}

export interface DashboardSettings {
  sizeWeeks: SizeConfig;
  thresholds: ThresholdConfig;
  display: DisplayConfig;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS: DashboardSettings = {
  sizeWeeks: { S: 4, M: 6, L: 12, XL: 24, XXL: 36 },
  thresholds: { overallocWarn: 100, overallocCrit: 130, etaSlipDays: 14 },
  display: {
    showArchived: false,
    showNotStarted: true,
    showCascadeGhost: true,
    defaultGanttView: "date",
  },
};

const STORAGE_KEY = "tpmo-dashboard-settings";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SettingsContextValue {
  settings: DashboardSettings;
  updateSettings: (patch: Partial<DashboardSettings>) => void;
  resetSettings: () => void;
  isModified: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  isModified: false,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] =
    useState<DashboardSettings>(DEFAULT_SETTINGS);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DashboardSettings>;
        setSettings((prev) => ({
          sizeWeeks: { ...prev.sizeWeeks, ...parsed.sizeWeeks },
          thresholds: { ...prev.thresholds, ...parsed.thresholds },
          display: { ...prev.display, ...parsed.display },
        }));
      }
    } catch {
      // ignore — corrupted storage
    }
  }, []);

  const updateSettings = (patch: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const next: DashboardSettings = {
        sizeWeeks: patch.sizeWeeks ?? prev.sizeWeeks,
        thresholds: patch.thresholds ?? prev.thresholds,
        display: patch.display ?? prev.display,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore — storage full / private mode
      }
      return next;
    });
  };

  const resetSettings = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSettings(DEFAULT_SETTINGS);
  };

  const isModified =
    JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings, isModified }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}

/** Expose size keys for iteration */
export const SIZE_KEYS: TShirtSize[] = ["S", "M", "L", "XL", "XXL"];
