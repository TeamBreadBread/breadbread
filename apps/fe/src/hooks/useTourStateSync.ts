import { useEffect } from "react";
import { getCurrentTour, type TourCurrentResponse } from "@/api/tours";
import { subscribeTourStateUpdate } from "@/utils/tourStateSync";

type UseTourStateSyncOptions = {
  courseId: number;
  /** 탭·화면이 보일 때 최신 투어 상태를 다시 조회 */
  active?: boolean;
  onRemoteUpdate?: (tour: TourCurrentResponse) => void;
};

/** /tour · 챗봇 투어 탭 간 방문 체크 상태 동기화 */
export function useTourStateSync({
  courseId,
  active = true,
  onRemoteUpdate,
}: UseTourStateSyncOptions): void {
  useEffect(() => {
    if (courseId <= 0 || !onRemoteUpdate) return undefined;

    return subscribeTourStateUpdate((tour) => {
      if (tour.courseId !== courseId) return;
      onRemoteUpdate(tour);
    });
  }, [courseId, onRemoteUpdate]);

  useEffect(() => {
    if (courseId <= 0 || !active || !onRemoteUpdate) return undefined;

    let cancelled = false;
    void getCurrentTour()
      .then((current) => {
        if (cancelled || !current || current.courseId !== courseId) return;
        onRemoteUpdate(current);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [courseId, active, onRemoteUpdate]);
}
