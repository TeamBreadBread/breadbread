import { createFileRoute } from "@tanstack/react-router";
import { redirectLoggedInUserFromLanding } from "@/lib/auth/preferenceOnboardingGate";
import LandingPage from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    await redirectLoggedInUserFromLanding();
  },
  component: LandingPage,
});
