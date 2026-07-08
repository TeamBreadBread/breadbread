import { getCurrentTour, startTour } from "@/api/tours";
import { trackTourStarted } from "@/lib/analytics/gtag";
import { saveRouteFocusCourseId } from "@/utils/aiCourseStorage";
import { hasConflictingActiveTour } from "@/utils/activeTourGuard";

export type StartCourseTourGuideResult =
  | { ok: true }
  | { ok: false; reason: "conflict" | "start_failed" };

type StartCourseTourGuideOptions = {
  courseId: number;
  startCourseGuide: (courseId: number) => void;
  saveRouteFocus?: boolean;
};

/** 코스 투어 시작 + 코스 안내 세션 활성화 */
export async function startCourseTourGuide({
  courseId,
  startCourseGuide,
  saveRouteFocus = false,
}: StartCourseTourGuideOptions): Promise<StartCourseTourGuideResult> {
  if (await hasConflictingActiveTour(courseId)) {
    return { ok: false, reason: "conflict" };
  }

  if (saveRouteFocus) {
    saveRouteFocusCourseId(courseId);
  }

  trackTourStarted(courseId);

  try {
    await startTour(courseId);
  } catch {
    /* 이미 진행 중(409)이면 투어 화면에서 복구 */
  }

  const current = await getCurrentTour().catch(() => null);
  if (current?.status === "IN_PROGRESS" && current.courseId === courseId) {
    startCourseGuide(courseId);
    return { ok: true };
  }

  return { ok: false, reason: "start_failed" };
}
