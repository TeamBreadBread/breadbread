import { createFileRoute } from "@tanstack/react-router";
import BreadRecommendationPreference from "@/pages/BreadRecommendationPreference";

export const Route = createFileRoute("/recommendation")({
  component: BreadRecommendationPreference,
});
