import { createFileRoute } from "@tanstack/react-router";
import BreadRecommendationPreference from "@/pages/BreadRecommendationPreference";
import { redirectToLoginIfUnauthenticated } from "@/lib/requireAuth";

export const Route = createFileRoute("/recommendation")({
  beforeLoad: () => {
    redirectToLoginIfUnauthenticated("/recommendation");
  },
  component: BreadRecommendationPreference,
});
