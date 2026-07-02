import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LandingIntro } from "@/components/domain/landing";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import {
  PREFERENCE_ONBOARDING_PATH,
  PREFERENCE_ONBOARDING_SEARCH,
  resolveHasPreferenceForLogin,
} from "@/lib/auth/preferenceOnboardingGate";
import { LANDING_DURATION_MS } from "@/utils/landingVisit";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleIntroComplete = useCallback(() => {
    if (!isLoggedIn()) {
      void navigate({ to: "/login-entry", replace: true, search: { redirect: undefined } });
      return;
    }

    void resolveHasPreferenceForLogin().then((hasPreference) => {
      if (hasPreference) {
        void navigate({ to: "/home", replace: true });
        return;
      }
      void navigate({
        to: PREFERENCE_ONBOARDING_PATH,
        search: PREFERENCE_ONBOARDING_SEARCH,
        replace: true,
      });
    });
  }, [navigate]);

  return <LandingIntro durationMs={LANDING_DURATION_MS} onComplete={handleIntroComplete} />;
}
