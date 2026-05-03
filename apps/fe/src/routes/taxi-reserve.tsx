import { createFileRoute } from "@tanstack/react-router";
import TaxiReservePage from "@/pages/TaxiReservePage";

export const Route = createFileRoute("/taxi-reserve")({
  component: TaxiReservePage,
});
