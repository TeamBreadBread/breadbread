import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import PreferenceRequiredDialog from "@/components/common/dialog/PreferenceRequiredDialog";
import {
  PREFERENCE_ONBOARDING_PATH,
  PREFERENCE_ONBOARDING_SEARCH,
} from "@/lib/auth/preferenceOnboardingGate";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { navigateToAiCourseEntry } from "@/utils/navigateToAiCourseEntry";

export function useAiCourseEntry(returnPath?: string) {
  const navigate = useNavigate();
  const { requireLogin } = useLoginRequired();
  const [isNavigating, setIsNavigating] = useState(false);
  const [preferenceDialogOpen, setPreferenceDialogOpen] = useState(false);

  const closePreferenceDialog = useCallback(() => {
    setPreferenceDialogOpen(false);
  }, []);

  const goToPreferenceSurvey = useCallback(() => {
    setPreferenceDialogOpen(false);
    void navigate({
      to: PREFERENCE_ONBOARDING_PATH,
      search: PREFERENCE_ONBOARDING_SEARCH,
    });
  }, [navigate]);

  const startAiCourseEntry = useCallback(() => {
    requireLogin(() => {
      if (isNavigating) return;
      setIsNavigating(true);
      void navigateToAiCourseEntry(navigate, {
        onPreferenceRequired: () => setPreferenceDialogOpen(true),
      }).finally(() => {
        setIsNavigating(false);
      });
    }, returnPath);
  }, [isNavigating, navigate, requireLogin, returnPath]);

  const preferenceRequiredDialog = (
    <PreferenceRequiredDialog
      open={preferenceDialogOpen}
      onCancel={closePreferenceDialog}
      onGoToSurvey={goToPreferenceSurvey}
    />
  );

  return {
    startAiCourseEntry,
    isNavigating,
    preferenceRequiredDialog,
  };
}
