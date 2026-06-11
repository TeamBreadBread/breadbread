import { useEffect, useRef, useState } from "react";
import { getCourseDetail } from "@/api/courses";
import { getCurrentTour } from "@/api/tours";
import { getDistanceMeters, TOUR_ARRIVAL_RADIUS_M } from "@/utils/geoDistance";

export type TourArrivalPrompt = {
  courseId: number;
  order: number;
  bakeryId: number;
  bakeryName: string;
  dismissKey: string;
};

type TourTarget = {
  courseId: number;
  order: number;
  bakeryId: number;
  bakeryName: string;
  lat: number;
  lng: number;
};

/**
 * 코스 진행 중 다음 방문 빵집 GPS 반경(30m) 접근 여부만 감지합니다.
 * 방문 체크 API는 호출하지 않으며, 사용자가 「완료처리」를 눌렀을 때만 별도 처리합니다.
 */
export function useTourArrivalProximity(
  enabled: boolean,
  courseId: number | null | undefined,
  isDismissed: (key: string) => boolean,
  recheckNonce = 0,
): TourArrivalPrompt | null {
  const [prompt, setPrompt] = useState<TourArrivalPrompt | null>(null);
  const tourTargetRef = useRef<TourTarget | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const isDismissedRef = useRef(isDismissed);
  const evaluatePositionRef = useRef<(latitude: number, longitude: number) => void>(() => {});

  const isActive = enabled && courseId != null && courseId > 0;

  useEffect(() => {
    isDismissedRef.current = isDismissed;
  }, [isDismissed]);

  useEffect(() => {
    if (!isActive || !courseId) {
      return () => {
        tourTargetRef.current = null;
        setPrompt(null);
      };
    }

    if (!navigator.geolocation) return undefined;

    let cancelled = false;

    const evaluatePosition = (latitude: number, longitude: number) => {
      lastCoordsRef.current = { lat: latitude, lng: longitude };
      const target = tourTargetRef.current;
      if (!target) {
        setPrompt(null);
        return;
      }

      const distance = getDistanceMeters(latitude, longitude, target.lat, target.lng);
      const dismissKey = `arrival:${target.courseId}:${target.order}`;

      if (distance <= TOUR_ARRIVAL_RADIUS_M && !isDismissedRef.current(dismissKey)) {
        setPrompt({
          courseId: target.courseId,
          order: target.order,
          bakeryId: target.bakeryId,
          bakeryName: target.bakeryName,
          dismissKey,
        });
        return;
      }

      setPrompt((prev) => (prev?.dismissKey === dismissKey ? null : prev));
    };

    evaluatePositionRef.current = evaluatePosition;

    const refreshTourTarget = async () => {
      try {
        const tour = await getCurrentTour();
        if (cancelled) return;

        if (!tour || tour.status !== "IN_PROGRESS" || tour.courseId !== courseId) {
          tourTargetRef.current = null;
          setPrompt(null);
          return;
        }

        const course = await getCourseDetail(courseId);
        if (cancelled) return;

        const visited = tour.currentVisitOrder ?? 0;
        const nextBakery = course.bakeries[visited];
        if (!nextBakery) {
          tourTargetRef.current = null;
          setPrompt(null);
          return;
        }

        const lat = nextBakery.lat;
        const lng = nextBakery.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          tourTargetRef.current = null;
          setPrompt(null);
          return;
        }

        const order = visited + 1;
        tourTargetRef.current = {
          courseId,
          order,
          bakeryId: nextBakery.id,
          bakeryName: nextBakery.name?.trim() || `${order}번 빵집`,
          lat,
          lng,
        };

        const last = lastCoordsRef.current;
        if (last) evaluatePosition(last.lat, last.lng);
      } catch {
        if (!cancelled) {
          tourTargetRef.current = null;
          setPrompt(null);
        }
      }
    };

    void refreshTourTarget();

    const refreshTimer = window.setInterval(() => void refreshTourTarget(), 15_000);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => evaluatePosition(pos.coords.latitude, pos.coords.longitude),
      () => {
        /* 위치 권한·센서 오류는 조용히 무시 */
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      navigator.geolocation.clearWatch(watchId);
      tourTargetRef.current = null;
      setPrompt(null);
    };
  }, [courseId, isActive]);

  useEffect(() => {
    if (!isActive) return;
    const last = lastCoordsRef.current;
    if (!last) return;

    queueMicrotask(() => {
      evaluatePositionRef.current(last.lat, last.lng);
    });
  }, [isActive, recheckNonce]);

  return isActive ? prompt : null;
}
