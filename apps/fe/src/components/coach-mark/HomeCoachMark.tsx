import CoachMarkOverlay from "@/components/coach-mark/CoachMarkOverlay";
import { useHomeCoachMark } from "@/components/coach-mark/useHomeCoachMark";

export default function HomeCoachMark() {
  const { open, stepIndex, step, totalSteps, handleNext } = useHomeCoachMark();

  if (!open) return null;

  return (
    <CoachMarkOverlay
      open={open}
      stepIndex={stepIndex}
      step={step}
      totalSteps={totalSteps}
      onNext={handleNext}
    />
  );
}
