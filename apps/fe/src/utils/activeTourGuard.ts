import { getCurrentTour } from "@/api/tours";

/** 다른 코스의 투어가 이미 진행 중이면 true */
export async function hasConflictingActiveTour(requestedCourseId: number): Promise<boolean> {
  const current = await getCurrentTour().catch(() => null);
  if (!current || current.status !== "IN_PROGRESS" || current.courseId <= 0) {
    return false;
  }
  return current.courseId !== requestedCourseId;
}
