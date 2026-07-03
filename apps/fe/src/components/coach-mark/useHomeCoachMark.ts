import { useCallback, useEffect, useState } from "react";
import { COACH_MARK_STEPS, type CoachMarkStep } from "@/components/coach-mark/coachMarkConfig";
import {
  persistCoachMarkDismissed,
  resolveShouldShowHomeCoachMark,
} from "@/components/coach-mark/coachMarkEligibility";

const TOTAL_STEPS = COACH_MARK_STEPS.length;

function pulseAiRecommendationCard(): void {
  const aiTarget = document.querySelector<HTMLElement>('[data-coach-target="ai-recommendation"]');
  aiTarget?.classList.add("coach-mark-finish-pulse");
  window.setTimeout(() => aiTarget?.classList.remove("coach-mark-finish-pulse"), 700);
}

export function useHomeCoachMark() {
  const [visible, setVisible] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const step: CoachMarkStep = COACH_MARK_STEPS[stepIndex] ?? COACH_MARK_STEPS[0];

  useEffect(() => {
    let cancelled = false;

    void resolveShouldShowHomeCoachMark().then((shouldShow) => {
      if (cancelled) return;
      setVisible(shouldShow);
      setResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const dismissCoachMark = useCallback(() => {
    persistCoachMarkDismissed();
    setVisible(false);
  }, []);

  const handleNext = useCallback(() => {
    if (stepIndex >= TOTAL_STEPS - 1) {
      pulseAiRecommendationCard();
      dismissCoachMark();
      return;
    }
    setStepIndex((prev) => prev + 1);
  }, [dismissCoachMark, stepIndex]);

  return {
    open: resolved && visible,
    stepIndex,
    step,
    totalSteps: TOTAL_STEPS,
    handleNext,
  };
}
