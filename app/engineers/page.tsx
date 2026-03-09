import Nav from "@/components/Nav";
import EngineerTable from "@/components/EngineerTable";
import { PortfolioPayload } from "@/lib/types";

async function getPortfolio(): Promise<PortfolioPayload | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/portfolio`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function EngineersPage() {
  const data = await getPortfolio();

  return (
    <>
      <Nav />
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-4">
        <h1 className="text-sm font-semibold text-zinc-200">Engineer Capacity</h1>
        {data ? (
          <EngineerTable engineers={data.engineers} projects={data.projects} />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-xs text-zinc-500">
            Could not load engineer data.
          </div>
        )}
      </main>
    </>
  );
}
