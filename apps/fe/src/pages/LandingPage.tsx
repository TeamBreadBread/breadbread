import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LandingIntro } from "@/components/domain/landing";

const LANDING_DURATION_MS = 3000;

export default function LandingPage() {
  const navigate = useNavigate();

  const handleIntroComplete = useCallback(() => {
    void navigate({ to: "/login-entry", replace: true, search: { redirect: undefined } });
  }, [navigate]);

  return <LandingIntro durationMs={LANDING_DURATION_MS} onComplete={handleIntroComplete} />;
}
