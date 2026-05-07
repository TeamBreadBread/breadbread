import { createFileRoute } from "@tanstack/react-router";
import MyReservationDetailPage from "@/pages/MyReservationDetailPage";

function parseReservationId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export const Route = createFileRoute("/my-reservation-detail")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: parseReservationId(search.id),
  }),
  component: MyReservationDetailRoute,
});

function MyReservationDetailRoute() {
  const search = Route.useSearch();
  return <MyReservationDetailPage reservationId={search.id} />;
}
