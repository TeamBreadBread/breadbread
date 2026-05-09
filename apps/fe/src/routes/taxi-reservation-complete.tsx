import { createFileRoute } from "@tanstack/react-router";
import TaxiReservationCompletePage from "@/pages/TaxiReservationCompletePage";

function parsePassengers(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(8, Math.max(1, value));
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.min(8, Math.max(1, n));
  }
  return 1;
}

function parsePositiveInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return 0;
}

export const Route = createFileRoute("/taxi-reservation-complete")({
  validateSearch: (search: Record<string, unknown>) => ({
    departureDate: typeof search.departureDate === "string" ? search.departureDate : "",
    departureTime: typeof search.departureTime === "string" ? search.departureTime : "",
    departurePlace: typeof search.departurePlace === "string" ? search.departurePlace : "",
    passengers: parsePassengers(search.passengers),
    courseId: parsePositiveInt(search.courseId),
    paidAmount: parsePositiveInt(search.paidAmount),
    courseName: typeof search.courseName === "string" ? search.courseName : "",
  }),
  component: TaxiReservationCompleteRoute,
});

function TaxiReservationCompleteRoute() {
  const search = Route.useSearch();
  return <TaxiReservationCompletePage {...search} />;
}
