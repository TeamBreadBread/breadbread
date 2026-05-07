import { createFileRoute } from "@tanstack/react-router";
import TaxiPaymentPage from "@/pages/TaxiPaymentPage";

function parsePassengers(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(8, Math.max(1, value));
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.min(8, Math.max(1, n));
  }
  return 1;
}

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export const Route = createFileRoute("/taxi-payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    departureDate: typeof search.departureDate === "string" ? search.departureDate : "",
    departureTime: typeof search.departureTime === "string" ? search.departureTime : "",
    departurePlace: typeof search.departurePlace === "string" ? search.departurePlace : "",
    passengers: parsePassengers(search.passengers),
    courseId: Math.max(0, Math.floor(parseNumber(search.courseId, 0))),
    lat: parseNumber(search.lat, 37.5665),
    lng: parseNumber(search.lng, 126.978),
  }),
  component: TaxiPaymentRoute,
});

function TaxiPaymentRoute() {
  const search = Route.useSearch();
  return <TaxiPaymentPage {...search} />;
}
