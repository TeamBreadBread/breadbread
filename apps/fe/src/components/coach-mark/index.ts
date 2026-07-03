export { default as HomeCoachMark } from "@/components/coach-mark/HomeCoachMark";
export {
  persistCoachMarkDismissed,
  registerCoachMarkServerResolver,
  resolveShouldShowHomeCoachMark,
  unregisterCoachMarkServerResolver,
  type CoachMarkServerEligibility,
  type CoachMarkServerResolver,
} from "@/components/coach-mark/coachMarkEligibility";
export {
  COACH_MARK_COMPLETED_KEY,
  clearCoachMarkCompleted,
  isCoachMarkCompletedForUser,
  markCoachMarkCompleted,
  readCoachMarkCompletedUserId,
} from "@/components/coach-mark/coachMarkStorage";
export { useHomeCoachMark } from "@/components/coach-mark/useHomeCoachMark";
