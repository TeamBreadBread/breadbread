import { createFileRoute } from "@tanstack/react-router";
import TaxiReservePage from "@/pages/TaxiReservePage";

function parseCourseId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.floor(value);
    return parsed > 0 ? parsed : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export const Route = createFileRoute("/taxi-reserve")({
  validateSearch: (search: Record<string, unknown>) => ({
    courseId: parseCourseId(search.courseId),
  }),
  component: TaxiReserveRoute,
});

function TaxiReserveRoute() {
  const search = Route.useSearch();
  return <TaxiReservePage courseId={search.courseId} />;
}
