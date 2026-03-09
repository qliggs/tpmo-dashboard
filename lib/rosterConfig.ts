export interface EngineerConfig {
  name: string;
  team: string;
  /** Fraction of one FTE this person contributes to this team (0–1) */
  capacity: number;
}

export interface TeamConfig {
  totalFTE: number;
  /** Fraction of totalFTE available for initiatives (non-BAU) */
  initiativePct: number;
  bauPct: number;
}

export const ENGINEERS: EngineerConfig[] = [
  { name: "Jordan Smalling",       team: "Endpoint Engineering", capacity: 1.0 },
  { name: "Cory Jamnick",          team: "Endpoint Engineering", capacity: 1.0 },
  { name: "Gary Olivieri",         team: "Endpoint Engineering", capacity: 0.5 },
  { name: "Gary Olivieri",         team: "Productivity Apps",    capacity: 0.5 },
  { name: "Lee English",           team: "Productivity Apps",    capacity: 1.0 },
  { name: "Colton Weaver",         team: "Productivity Apps",    capacity: 1.0 },
  { name: "Chester Reyes",         team: "Productivity Apps",    capacity: 1.0 },
  { name: "Mike Musselwhite",      team: "NetOps",               capacity: 1.0 },
  { name: "Tom Hensley",           team: "NetOps",               capacity: 1.0 },
  { name: "Jeremy Stamps",         team: "NetOps",               capacity: 1.0 },
  { name: "Aaron Parker",          team: "Infrastructure",       capacity: 1.0 },
  { name: "Jayendra Pandit",       team: "Infrastructure",       capacity: 0.5 },
  { name: "Sakea Williamson",      team: "Service Desk",         capacity: 1.0 },
  { name: "Michael Caldwell",      team: "Service Desk",         capacity: 1.0 },
  { name: "James Goins",           team: "Service Desk",         capacity: 1.0 },
  { name: "Monica Sandoval",       team: "Service Desk",         capacity: 1.0 },
  { name: "Nicholas Lemanski",     team: "Service Desk",         capacity: 1.0 },
  { name: "Pierre Keaton",         team: "Service Desk",         capacity: 1.0 },
  { name: "Mahesh Chennamreddi",   team: "Service Desk",         capacity: 1.0 },
  { name: "Jessica Maciel",        team: "TPMO",                 capacity: 1.0 },
  { name: "LaTasha Ransom",        team: "TPMO",                 capacity: 1.0 },
];

export const TEAM_CONFIG: Record<string, TeamConfig> = {
  "Endpoint Engineering": { totalFTE: 2.5, initiativePct: 0.65, bauPct: 0.35 },
  "Productivity Apps":    { totalFTE: 3.5, initiativePct: 0.70, bauPct: 0.30 },
  "NetOps":               { totalFTE: 3.0, initiativePct: 0.70, bauPct: 0.30 },
  "Infrastructure":       { totalFTE: 1.5, initiativePct: 0.70, bauPct: 0.30 },
  "Service Desk":         { totalFTE: 7.0, initiativePct: 0.30, bauPct: 0.70 },
  "TPMO":                 { totalFTE: 2.0, initiativePct: 1.00, bauPct: 0.00 },
};

/**
 * Returns the initiative FTE available for a team.
 * Initiative FTE = totalFTE × initiativePct
 */
export function getInitiativeFTE(team: string): number {
  const cfg = TEAM_CONFIG[team];
  if (!cfg) return 0;
  return cfg.totalFTE * cfg.initiativePct;
}

/** Returns all unique team names from the config */
export const TEAM_NAMES = Object.keys(TEAM_CONFIG);
