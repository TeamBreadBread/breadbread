import { getCourseDirections, type CourseDirectionPoint } from "@/api/courses";
import {
  COURSE_TRANSPORT_MODE_CHANGED,
  courseTransportToRouteMode,
  type CourseTransportMode,
} from "@/lib/courseTransportMode";

/** 세션 내 메모리 캐시 — 위·경도를 sessionStorage에 저장하지 않음 (CodeQL taint 회피) */
const routeMemoryCache = new Map<string, CourseDirectionPoint[]>();

export const COURSE_ROUTE_CACHE_CHANGED = "course-route-cache-changed";

function routeCacheKey(courseId: number, mode: CourseTransportMode): string {
  return `${courseId}:${courseTransportToRouteMode(mode)}`;
}

export function normalizeCourseDirectionPath(
  path:
    | Array<Partial<CourseDirectionPoint> & { latitude?: number; longitude?: number }>
    | null
    | undefined,
): CourseDirectionPoint[] {
  if (!Array.isArray(path)) return [];

  const normalized: CourseDirectionPoint[] = [];
  for (const point of path) {
    const lat = point.lat ?? point.latitude;
    const lng = point.lng ?? point.longitude;
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      normalized.push({ lat, lng });
    }
  }
  return normalized;
}

export function readCourseRouteCache(
  courseId: number,
  mode: CourseTransportMode,
): CourseDirectionPoint[] | null {
  const path = routeMemoryCache.get(routeCacheKey(courseId, mode));
  return path && path.length >= 2 ? path : null;
}

export function saveCourseRouteCache(
  courseId: number,
  mode: CourseTransportMode,
  path: CourseDirectionPoint[],
): void {
  if (path.length < 2) return;
  routeMemoryCache.set(routeCacheKey(courseId, mode), path);
  window.dispatchEvent(new CustomEvent(COURSE_ROUTE_CACHE_CHANGED, { detail: { courseId, mode } }));
}

/** 이동 수단 저장 직후 directions API를 미리 조회해 챗봇 지도 등에서 즉시 사용 */
export function prefetchCourseRoute(courseId: number, mode: CourseTransportMode): void {
  void getCourseDirections(courseId, courseTransportToRouteMode(mode))
    .then((directions) => {
      const path = normalizeCourseDirectionPath(directions.path);
      if (path.length >= 2) {
        saveCourseRouteCache(courseId, mode, path);
      }
    })
    .catch(() => {
      /* 지도는 로드 완료 후 점선 폴백 */
    });
}

export function subscribeCourseRouteInputs(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener(COURSE_TRANSPORT_MODE_CHANGED, handler);
  window.addEventListener(COURSE_ROUTE_CACHE_CHANGED, handler);
  return () => {
    window.removeEventListener(COURSE_TRANSPORT_MODE_CHANGED, handler);
    window.removeEventListener(COURSE_ROUTE_CACHE_CHANGED, handler);
  };
}
