import { createFileRoute } from "@tanstack/react-router";
import BreadPreference from "@/pages/BreadPreference";

export const Route = createFileRoute("/preference")({
  component: BreadPreference,
});
