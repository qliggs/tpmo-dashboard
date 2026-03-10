import Nav from "@/components/Nav";
import RiskRegister from "@/components/RiskRegister";
import { Project } from "@/lib/types";

async function getProjects(): Promise<Project[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/projects`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    // Route returns { projects, warnings } — extract projects
    return Array.isArray(data) ? data : (data.projects ?? []);
  } catch {
    return [];
  }
}

export default async function RiskPage() {
  const projects = await getProjects();

  return (
    <>
      <Nav />
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Risk Register</h1>
        <RiskRegister projects={projects} />
      </main>
    </>
  );
}
