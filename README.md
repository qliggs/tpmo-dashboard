# TPMO Portfolio Intelligence Dashboard

A live, full-stack portfolio management dashboard built for real-world Technical Program Management operations. This project was architected and product-owned by a Senior TPM to replace manual Excel-based capacity forecasting with a dynamic, Notion-integrated web application.

**Live Demo:** https://tpmo-dashboard.vercel.app

---

## The Problem It Solves

Managing a portfolio of 60+ technical projects across 5 engineering teams — with named engineer assignments, shifting timelines, and quarterly capacity constraints — produces a class of problems that spreadsheets can't handle well:

- When a project slips, which downstream projects does it affect, and by how much?
- Which engineers are overcommitted next quarter, and which projects are at risk because of it?
- How does the current project load compare to the capacity forecast leadership built?
- If a project starts late due to its t-shirt size and quarter placement, when does it actually end?

This dashboard answers all of those questions automatically, in real time, from a single Notion database.

---

## Architecture & Business Logic

The intelligence in this application lives in five custom engines, all written as pure TypeScript functions in `/lib`:

### `etaCalculator.ts`

Derives project end dates from t-shirt size when no end date exists in Notion. Automatically infers start dates from the project's assigned quarter when no start date is set.

| T-Shirt Size | Duration |
|---|---|
| S | 4 weeks |
| M | 6 weeks |
| L | 12 weeks (1 quarter) |
| XL | 24 weeks (2 quarters) |

### `cascadeEngine.ts`

The most complex engine. Propagates delays forward across the portfolio iteratively (up to 10 passes) until the schedule is stable. Logic:

1. For each engineer, determines their "free date" — the latest end date across all their active projects
2. If their free date falls after the planned start of a future assigned project, that project's start and end dates are recalculated
3. Each affected project receives a `CASCADE_DELAY` flag with the blocking engineer and project identified
4. The engine re-runs until no new delays are detected, handling multi-hop dependency chains

### `riskDetector.ts`

Evaluates every project against four risk conditions and assigns severity:

| Risk Type | Trigger |
|---|---|
| `TIMELINE_SLIP` | Calculated end date falls in a later quarter than planned |
| `ENGINEER_OVERALLOCATION` | Engineer's total FTE across concurrent projects exceeds capacity |
| `CASCADE_DELAY` | Start date pushed due to upstream engineer unavailability |
| `END_DATE_SLIP` | Calculated ETA is 14+ days past the original Notion end date |

Severity is `warning` or `critical` based on magnitude of the slip or degree of overallocation.

### `capacityIndex.ts`

Replicates a director-built Excel capacity forecasting model and extends it with live data.

```
Capacity Index = (Initiative FTE Committed) / (Initiative FTE Available) × 100
```

- **Baseline** — hardcoded from the director's Q1/Q2 commit model
- **Live** — calculated dynamically from current Notion project assignments
- **Delta** — difference between live and baseline, showing portfolio drift from forecast

Rendered as a heat map: green (under capacity) → yellow (approaching full) → orange (over) → red (critical).

### `rosterConfig.ts`

Authoritative team configuration — 21 engineers across 6 teams, with initiative vs. BAU capacity splits per team. Engineers with split team assignments (e.g., 0.5 FTE on two teams) are handled correctly throughout all calculations.

---

## Dashboard Views

| View | Purpose |
|---|---|
| Portfolio Overview | 6 KPI summary cards + Gantt + progress charts |
| Gantt | Rolling 9-month timeline with By Date / By Initiative / By Quarter / H1 / H2 / Annual views |
| Capacity | Heat map with Baseline / Live / Delta toggle + engineer and team allocation tables |
| Engineers | Named engineer per-quarter allocation, overload highlighting, team bar charts |
| Risk Register | All flagged projects with severity, reason, and recommended actions |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, React Server Components)
- **Language:** TypeScript throughout
- **Styling:** Tailwind CSS — dark theme, IBM Plex Mono
- **Charts:** Recharts
- **Data:** Notion API via `@notionhq/client`
- **Deployment:** Vercel (auto-deploy on push)
- **Caching:** Next.js fetch cache, 60s TTL on all Notion requests

---

## Project Structure

```
/app
  /api
    /projects/route.ts      — projects with ETA, cascade, risk
    /engineers/route.ts     — engineers with allocation summaries
    /portfolio/route.ts     — combined dashboard payload
    /capacity/route.ts      — baseline / live / delta index
  /page.tsx                 — dashboard home
  /gantt/page.tsx
  /capacity/page.tsx
  /engineers/page.tsx
  /risk/page.tsx
/lib
  rosterConfig.ts           — team/engineer config (source of truth)
  etaCalculator.ts          — t-shirt size → end date
  cascadeEngine.ts          — iterative delay propagation
  riskDetector.ts           — risk flag logic
  capacityIndex.ts          — capacity forecasting model
  notionClient.ts           — paginated Notion API wrapper
/components
  SummaryCards.tsx
  GanttView.tsx
  CapacityHeatmap.tsx
  EngineerTable.tsx
  RiskRegister.tsx
  ProgressCharts.tsx
```

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/qliggs/tpmo-dashboard.git
cd tpmo-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Notion API key and database IDs

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

### Environment Variables

```
NOTION_API_KEY=secret_...
NOTION_PROJECTS_DB_ID=
NOTION_ENGINEERS_DB_ID=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

To connect to Notion:

1. Create an integration at https://www.notion.so/my-integrations
2. Share your Projects and Engineers databases with the integration
3. Copy the database IDs from the Notion URLs

---

## Deploying to Vercel

```bash
npx vercel
npx vercel env add NOTION_API_KEY
npx vercel env add NOTION_PROJECTS_DB_ID
npx vercel env add NOTION_ENGINEERS_DB_ID
npx vercel env add NEXT_PUBLIC_BASE_URL
npx vercel --prod
```

---

## About This Project

This dashboard was designed and product-owned by a Technical Program Manager managing a portfolio of 60+ projects across a 45-engineer organization. The goal was to move portfolio visibility out of static spreadsheets and into a living system that reflects real project state — with enough intelligence to surface risk before it becomes a miss.

The cascade delay engine and capacity index model are the core innovations. The cascade engine solves a problem that no off-the-shelf PM tool handles well: when an engineer slips on one project, the system automatically recalculates every downstream project they're assigned to and flags the resulting risk with a specific, actionable reason. The capacity index model was adapted from a director-level Excel forecast and extended with live Notion data, giving leadership a real-time view of how actual commitments compare to the original plan.

Built with Next.js, TypeScript, Notion API, and Vercel.
