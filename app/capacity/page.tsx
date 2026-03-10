import Nav from "@/components/Nav";
import CapacityHeatmap from "@/components/CapacityHeatmap";
import EngineerTable from "@/components/EngineerTable";
import { CapacityPayload, PortfolioPayload } from "@/lib/types";

async function getData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const [capacityRes, portfolioRes] = await Promise.allSettled([
    fetch(`${base}/api/capacity`, { next: { revalidate: 60 } }),
    fetch(`${base}/api/portfolio`, { next: { revalidate: 60 } }),
  ]);

  const capacity: CapacityPayload | null =
    capacityRes.status === "fulfilled" && capacityRes.value.ok
      ? await capacityRes.value.json()
      : null;

  const portfolio: PortfolioPayload | null =
    portfolioRes.status === "fulfilled" && portfolioRes.value.ok
      ? await portfolioRes.value.json()
      : null;

  return { capacity, portfolio };
}

export default async function CapacityPage() {
  const { capacity, portfolio } = await getData();

  return (
    <>
      <Nav />
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Capacity Intelligence</h1>

        {capacity ? (
          <CapacityHeatmap data={capacity} />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-xs text-zinc-500">
            Could not load capacity data.
          </div>
        )}

        {portfolio && (
          <EngineerTable
            engineers={portfolio.engineers}
            projects={portfolio.projects}
          />
        )}
      </main>
    </>
  );
}
