import { createFileRoute } from "@tanstack/react-router";
import MyReservationsPage from "@/pages/MyReservationsPage";

export const Route = createFileRoute("/my-reservations")({
  component: MyReservationsPage,
});
