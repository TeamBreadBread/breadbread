import { useEffect, useState } from "react";
import { getCourseDetail } from "@/api/courses";
import { checkTourCongestion, getCurrentTour } from "@/api/tours";
import { findPrimaryCongestionAlert } from "@/utils/congestionCheck";

/** 코스 안내 중 다음 방문 빵집 혼잡 여부 */
export function useTourCongestionAlert(
  courseGuideActive: boolean,
  courseGuideId: number | null,
): boolean {
  const isActive = courseGuideActive && courseGuideId != null && courseGuideId > 0;
  const [isCongestion, setIsCongestion] = useState(false);

  useEffect(() => {
    if (!isActive || courseGuideId == null) return undefined;

    let cancelled = false;

    const refresh = async () => {
      try {
        const tour = await getCurrentTour();
        if (cancelled) return;

        if (!tour || tour.status !== "IN_PROGRESS" || tour.courseId !== courseGuideId) {
          setIsCongestion(false);
          return;
        }

        const course = await getCourseDetail(courseGuideId);
        const visited = tour.currentVisitOrder ?? 0;
        const nextBakery = course.bakeries[visited];
        if (!nextBakery) {
          setIsCongestion(false);
          return;
        }

        const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
        const res = await checkTourCongestion({
          courseId: courseGuideId,
          bakeryIds,
          targetBakeryId: nextBakery.id,
        });
        if (cancelled) return;

        setIsCongestion(findPrimaryCongestionAlert(res.data ?? []) != null);
      } catch {
        if (!cancelled) setIsCongestion(false);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isActive, courseGuideId]);

  return isActive ? isCongestion : false;
}
