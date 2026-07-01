import { useEffect, useState, useSyncExternalStore } from "react";
import { getCourseDirections, type CourseDirectionPoint } from "@/api/courses";
import {
  COURSE_TRANSPORT_MODE_CHANGED,
  courseTransportToRouteMode,
  readCourseTransportMode,
  type CourseTransportMode,
} from "@/lib/courseTransportMode";

function subscribeTransportMode(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener(COURSE_TRANSPORT_MODE_CHANGED, handler);
  return () => window.removeEventListener(COURSE_TRANSPORT_MODE_CHANGED, handler);
}

function readTransportModeForCourse(courseId: number | null): CourseTransportMode | null {
  if (courseId == null || courseId <= 0) return null;
  return readCourseTransportMode(courseId);
}

type RouteFetchState = {
  key: string;
  path: CourseDirectionPoint[] | null;
};

/** BE `GET /courses/{id}/directions`로 이동 수단별 경로 좌표를 조회합니다. */
export function useCourseRoutePath(courseId: number | null | undefined) {
  const validCourseId = courseId != null && courseId > 0 ? courseId : null;

  const transportMode = useSyncExternalStore(
    subscribeTransportMode,
    () => readTransportModeForCourse(validCourseId),
    () => null,
  );

  const fetchKey =
    validCourseId != null && transportMode != null
      ? `${validCourseId}:${courseTransportToRouteMode(transportMode)}`
      : null;

  const [routeState, setRouteState] = useState<RouteFetchState | null>(null);

  useEffect(() => {
    if (fetchKey == null || validCourseId == null || transportMode == null) return;

    let cancelled = false;
    const routeMode = courseTransportToRouteMode(transportMode);

    void getCourseDirections(validCourseId, routeMode)
      .then((directions) => {
        if (cancelled) return;
        const path = directions.path?.filter(
          (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
        );
        setRouteState({
          key: fetchKey,
          path: path && path.length >= 2 ? path : null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setRouteState({ key: fetchKey, path: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, transportMode, validCourseId]);

  const routePath = fetchKey != null && routeState?.key === fetchKey ? routeState.path : null;
  const routeLoading = fetchKey != null && routeState?.key !== fetchKey;

  return { routePath, routeLoading, transportMode: validCourseId != null ? transportMode : null };
}
