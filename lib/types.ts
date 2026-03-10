/** Notion project statuses — includes all known Notion values + Unknown fallback */
export type ProjectStatus =
  | "Not Started"
  | "Ready to Start"
  | "In Progress"
  | "Blocked"
  | "Archived"
  | "Cancelled"
  | "Unknown";

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TShirtSize = "S" | "M" | "L" | "XL" | "XXL";

/** Normalized quarter string, e.g. "Q2 2026". Kept as string for Notion flexibility. */
export type Timeline = string;

/** Normalized project as returned by our API */
export interface Project {
  id: string;
  initiative: string;
  deliverable: string;
  /** ISO date string */
  startDate: string;
  /** ISO date string — may be calculated if missing from Notion */
  endDate: string;
  /** True if endDate was calculated (not from Notion) */
  endDateCalculated: boolean;
  tshirtSize: TShirtSize | null;
  priority: Priority | null;
  status: ProjectStatus | null;
  timeline: Timeline | null;
  /** IDs of assigned engineers (from Notion relation) */
  engineerIds: string[];
  /** Names resolved from roster */
  engineerNames: string[];
  risks: RiskFlag[];
  cascadeDelay?: CascadeDelay;
}

/** Normalized engineer as returned by our API */
export interface Engineer {
  id: string;
  name: string;
  team: string;
  /** From Notion (0–100) or derived from rosterConfig */
  allocationPct: number;
  /** ISO date string or null */
  availableFrom: string | null;
  /** Project IDs assigned via Notion relation */
  projectIds: string[];
}

/** Cascade delay attached to a project */
export interface CascadeDelay {
  engineer: string;
  blockingProject: string;
  originalStart: string;
  newStart: string;
  newEnd: string;
}

export type RiskType =
  | "TIMELINE_SLIP"
  | "ENGINEER_OVERALLOCATION"
  | "CASCADE_DELAY"
  | "END_DATE_SLIP";

export type RiskSeverity = "warning" | "critical";

export interface RiskFlag {
  type: RiskType;
  severity: RiskSeverity;
  reason: string;
  affectedEngineer?: string;
  recommendedAction: string;
}

/** Portfolio payload returned by /api/portfolio */
export interface PortfolioPayload {
  projects: Project[];
  engineers: Engineer[];
  generatedAt: string;
  /** Non-fatal data issues encountered during fetch/transform */
  warnings: string[];
}

/** Capacity index cell */
export interface CapacityCell {
  team: string;
  /** YYYY-MM */
  month: string;
  baselineIndex: number;
  liveIndex: number;
  delta: number;
  /** Projects contributing to liveIndex in this cell */
  contributors: CapacityContributor[];
  initiativeFTEAvailable: number;
  initiativeFTECommitted: number;
}

export interface CapacityContributor {
  projectId: string;
  projectName: string;
  engineers: { name: string; fte: number }[];
  totalFTE: number;
}

export interface CapacityPayload {
  teams: string[];
  months: string[];
  cells: CapacityCell[];
}
