import { createFileRoute } from "@tanstack/react-router";
import RoutePage from "@/pages/RoutePage";

export const Route = createFileRoute("/route/")({
  component: RoutePage,
});
