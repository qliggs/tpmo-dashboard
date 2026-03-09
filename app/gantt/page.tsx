import Nav from "@/components/Nav";
import GanttView from "@/components/GanttView";
import { Project } from "@/lib/types";

async function getProjects(): Promise<Project[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/projects`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function GanttPage() {
  const projects = await getProjects();

  return (
    <>
      <Nav />
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-4">
        <h1 className="text-sm font-semibold text-zinc-200">Gantt Chart</h1>
        <GanttView projects={projects} />
      </main>
    </>
  );
}
