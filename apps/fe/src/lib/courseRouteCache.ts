import { getCourseDirections, type CourseDirectionPoint } from "@/api/courses";
import {
  COURSE_TRANSPORT_MODE_CHANGED,
  courseTransportToRouteMode,
  type CourseTransportMode,
} from "@/lib/courseTransportMode";

const ROUTE_CACHE_PREFIX = "breadbread_course_route:";

const BLOCKED_JSON_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function parseJsonSafely(raw: string): unknown {
  return JSON.parse(raw, (key, value) => {
    if (BLOCKED_JSON_KEYS.has(key)) return undefined;
    return value;
  });
}

function isRoutePointRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function readRoutePoint(point: Record<string, unknown>): CourseDirectionPoint | null {
  const lat = point.lat ?? point.latitude;
  const lng = point.lng ?? point.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function routeCacheStorageKey(courseId: number, mode: CourseTransportMode): string {
  return `${ROUTE_CACHE_PREFIX}${courseId}:${courseTransportToRouteMode(mode)}`;
}

export const COURSE_ROUTE_CACHE_CHANGED = "course-route-cache-changed";

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
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(routeCacheStorageKey(courseId, mode));
  if (!raw) return null;
  try {
    const parsed = parseJsonSafely(raw);
    if (!Array.isArray(parsed)) return null;

    const path: CourseDirectionPoint[] = [];
    for (const item of parsed) {
      if (!isRoutePointRecord(item)) continue;
      const point = readRoutePoint(item);
      if (point) path.push(point);
    }
    return path.length >= 2 ? path : null;
  } catch {
    return null;
  }
}

export function saveCourseRouteCache(
  courseId: number,
  mode: CourseTransportMode,
  path: CourseDirectionPoint[],
): void {
  if (typeof sessionStorage === "undefined" || path.length < 2) return;
  sessionStorage.setItem(routeCacheStorageKey(courseId, mode), JSON.stringify(path));
  window.dispatchEvent(new CustomEvent(COURSE_ROUTE_CACHE_CHANGED, { detail: { courseId, mode } }));
}

export function subscribeCourseRouteCache(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener(COURSE_ROUTE_CACHE_CHANGED, handler);
  return () => window.removeEventListener(COURSE_ROUTE_CACHE_CHANGED, handler);
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
