import { useEffect, useState, useSyncExternalStore } from "react";
import { getCourseDirections } from "@/api/courses";
import {
  normalizeCourseDirectionPath,
  readCourseRouteCache,
  saveCourseRouteCache,
  subscribeCourseRouteInputs,
} from "@/lib/courseRouteCache";
import {
  courseTransportToRouteMode,
  readCourseTransportMode,
  type CourseTransportMode,
} from "@/lib/courseTransportMode";

type RouteFetchState = {
  key: string;
  path: ReturnType<typeof normalizeCourseDirectionPath> | null;
};

function readTransportModeForCourse(courseId: number | null): CourseTransportMode | null {
  if (courseId == null || courseId <= 0) return null;
  return readCourseTransportMode(courseId);
}

function readCachedRouteForCourse(courseId: number | null, mode: CourseTransportMode | null) {
  if (courseId == null || courseId <= 0 || mode == null) return null;
  return readCourseRouteCache(courseId, mode);
}

/** BE `GET /courses/{id}/directions`로 이동 수단별 경로 좌표를 조회합니다. */
export function useCourseRoutePath(courseId: number | null | undefined) {
  const validCourseId = courseId != null && courseId > 0 ? courseId : null;

  const transportMode = useSyncExternalStore(
    subscribeCourseRouteInputs,
    () => readTransportModeForCourse(validCourseId),
    () => null,
  );

  const cachedPath = useSyncExternalStore(
    subscribeCourseRouteInputs,
    () => readCachedRouteForCourse(validCourseId, transportMode),
    () => null,
  );

  const fetchKey =
    validCourseId != null && transportMode != null
      ? `${validCourseId}:${courseTransportToRouteMode(transportMode)}`
      : null;

  const [routeState, setRouteState] = useState<RouteFetchState | null>(null);

  useEffect(() => {
    if (fetchKey == null || validCourseId == null || transportMode == null) return;
    if (cachedPath && cachedPath.length >= 2) return;

    let cancelled = false;
    const routeMode = courseTransportToRouteMode(transportMode);

    void getCourseDirections(validCourseId, routeMode)
      .then((directions) => {
        if (cancelled) return;
        const path = normalizeCourseDirectionPath(directions.path);
        const resolvedPath = path.length >= 2 ? path : null;
        if (resolvedPath) {
          saveCourseRouteCache(validCourseId, transportMode, resolvedPath);
        }
        setRouteState({
          key: fetchKey,
          path: resolvedPath,
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
  }, [cachedPath, fetchKey, transportMode, validCourseId]);

  const resolvedPath =
    cachedPath ?? (fetchKey != null && routeState?.key === fetchKey ? routeState.path : null);

  const fetchSettled = fetchKey != null && routeState?.key === fetchKey;
  const routeLoading = fetchKey != null && resolvedPath == null && !fetchSettled;

  return {
    routePath: resolvedPath,
    routeLoading,
    transportMode: validCourseId != null ? transportMode : null,
  };
}
