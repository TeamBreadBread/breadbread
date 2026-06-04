import { createFileRoute } from "@tanstack/react-router";
import TourPage from "@/pages/TourPage";

function parseCourseId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export const Route = createFileRoute("/tour")({
  validateSearch: (search: Record<string, unknown>) => ({
    courseId: parseCourseId(search.courseId),
  }),
  component: TourRoute,
});

function TourRoute() {
  const search = Route.useSearch();
  return <TourPage courseId={search.courseId} />;
}
