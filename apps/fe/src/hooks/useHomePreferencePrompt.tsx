import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import PreferenceRequiredDialog from "@/components/common/dialog/PreferenceRequiredDialog";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import {
  PREFERENCE_ONBOARDING_PATH,
  PREFERENCE_ONBOARDING_SEARCH,
  resolveHasPreferenceForLogin,
} from "@/lib/auth/preferenceOnboardingGate";
import {
  dismissHomePreferencePrompt,
  isHomePreferencePromptDismissed,
  isMandatoryPreferenceOnboarding,
} from "@/lib/auth/preferenceOnboardingSession";

const HOME_PREFERENCE_DIALOG_MESSAGE =
  "유저선호도조사를 진행하셔야지 AI 추천 서비스를 이용할 수 있습니다!";

export function useHomePreferencePrompt() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    if (isMandatoryPreferenceOnboarding()) return;
    if (isHomePreferencePromptDismissed()) return;

    let cancelled = false;
    void resolveHasPreferenceForLogin()
      .then((hasPreference) => {
        if (cancelled || hasPreference) return;
        setOpen(true);
      })
      .catch(() => {
        /* 네트워크 오류 시 팝업 생략 */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const closeDialog = useCallback(() => {
    dismissHomePreferencePrompt();
    setOpen(false);
  }, []);

  const goToSurvey = useCallback(() => {
    setOpen(false);
    void navigate({
      to: PREFERENCE_ONBOARDING_PATH,
      search: PREFERENCE_ONBOARDING_SEARCH,
    });
  }, [navigate]);

  const dialog = (
    <PreferenceRequiredDialog
      open={open}
      title="선호도 조사 안내"
      message={HOME_PREFERENCE_DIALOG_MESSAGE}
      cancelLabel="닫기"
      confirmLabel="선호도 조사 하러가기"
      onCancel={closeDialog}
      onGoToSurvey={goToSurvey}
    />
  );

  return { dialog };
}
