import { createFileRoute } from "@tanstack/react-router";
import BreadPreferencePage from "@/pages/BreadPreferencePage";

export const Route = createFileRoute("/")({
  component: BreadPreferencePage,
});
