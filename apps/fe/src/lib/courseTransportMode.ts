import { prefetchCourseRoute } from "@/lib/courseRouteCache";

/** 코스 안내 이동 수단 — UI 선택값 */
export type CourseTransportMode = "WALKING" | "BIKE" | "CAR";

/** BE `GET /courses/{id}/directions` 쿼리 `mode` */
export type CourseRouteMode = "WALKING" | "DRIVING";

const STORAGE_PREFIX = "breadbread_course_transport:";

function storageKey(courseId: number): string {
  return `${STORAGE_PREFIX}${courseId}`;
}

export const COURSE_TRANSPORT_MODE_CHANGED = "course-transport-mode-changed";

export function courseTransportToRouteMode(mode: CourseTransportMode): CourseRouteMode {
  return mode === "WALKING" ? "WALKING" : "DRIVING";
}

export async function saveCourseTransportMode(
  courseId: number,
  mode: CourseTransportMode,
): Promise<void> {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(storageKey(courseId), mode);
  window.dispatchEvent(
    new CustomEvent(COURSE_TRANSPORT_MODE_CHANGED, { detail: { courseId, mode } }),
  );
  await prefetchCourseRoute(courseId, mode);
}

export function readCourseTransportMode(courseId: number): CourseTransportMode | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(courseId));
  if (raw === "WALKING" || raw === "BIKE" || raw === "CAR") return raw;
  return null;
}

export const COURSE_TRANSPORT_OPTIONS: ReadonlyArray<{
  mode: CourseTransportMode;
  label: string;
  description: string;
}> = [
  { mode: "WALKING", label: "도보 이용", description: "보도·보행로 기준 경로" },
  { mode: "BIKE", label: "타슈 이용", description: "도로 기준 자전거·공유 이동" },
  { mode: "CAR", label: "자차 이용", description: "자동차 도로 기준 경로" },
];
