import { PageLoadingSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return <PageLoadingSkeleton sections={["heatmap", "table"]} />;
}
