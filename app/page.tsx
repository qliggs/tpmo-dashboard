import Nav from "@/components/Nav";
import SummaryCards from "@/components/SummaryCards";
import GanttView from "@/components/GanttView";
import ProgressCharts from "@/components/ProgressCharts";
import { PortfolioPayload } from "@/lib/types";

async function getPortfolio(): Promise<PortfolioPayload | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/portfolio`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getPortfolio();

  if (!data) {
    return (
      <>
        <Nav />
        <main className="max-w-screen-2xl mx-auto px-6 py-8">
          <div className="bg-red-950/30 border border-red-800 rounded-lg p-6 text-sm text-red-300">
            <strong>Could not load portfolio data.</strong> Ensure NOTION_API_KEY,
            NOTION_PROJECTS_DB_ID, and NOTION_ENGINEERS_DB_ID are set.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Portfolio Overview</h1>
          <span className="text-sm text-slate-600">
            Updated {new Date(data.generatedAt).toLocaleTimeString()}
          </span>
        </div>

        <SummaryCards projects={data.projects} engineers={data.engineers} />

        <GanttView projects={data.projects} />

        <ProgressCharts projects={data.projects} />
      </main>
    </>
  );
}
