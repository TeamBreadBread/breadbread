/** AI 코스 출발 좌표 — 같은 탭 세션 동안 메모리에만 보관 (좌표는 sessionStorage에 저장하지 않음) */
export type AiCourseDeparture = {
  latitude: number;
  longitude: number;
  markerLabel?: string;
};

export type AiCourseDeparturePoint = {
  lat: number;
  lng: number;
  label: string;
};

const DEPARTURE_COORDS_STORAGE_KEY = "aiCourseDepartureCoords";
const DEPARTURE_MARKER_LABEL_STORAGE_KEY = "aiCourseDepartureMarkerLabel";
const DEPARTURE_BY_JOB_PREFIX = "aiCourseDepartureJob:";
const DEPARTURE_BY_COURSE_PREFIX = "aiCourseDepartureCourse:";

let pending: AiCourseDeparture | null = null;
let latest: AiCourseDeparture | null = null;
const departureByJobId = new Map<string, AiCourseDeparture>();
const departureByCourseId = new Map<number, AiCourseDeparture>();

/** 이전 버전에서 sessionStorage에 남아 있을 수 있는 좌표 평문 데이터 제거 */
function clearLegacyPersistedCoords(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(DEPARTURE_COORDS_STORAGE_KEY);

  const keysToRemove: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(DEPARTURE_BY_JOB_PREFIX) || key?.startsWith(DEPARTURE_BY_COURSE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
}

function persistMarkerLabel(label: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY, label);
}

function toDeparturePoint(departure: AiCourseDeparture): AiCourseDeparturePoint {
  return {
    lat: departure.latitude,
    lng: departure.longitude,
    label: departure.markerLabel?.trim() || getAiCourseDepartureMarkerLabel() || "출발지",
  };
}

function hasValidCoords(latitude?: number | null, longitude?: number | null): boolean {
  return (
    latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)
  );
}

clearLegacyPersistedCoords();

export function setAiCourseDepartureCoords(
  latitude: number,
  longitude: number,
  markerLabel?: string,
): void {
  const label = markerLabel?.trim() || "출발지";
  const value: AiCourseDeparture = {
    latitude,
    longitude,
    markerLabel: label,
  };
  pending = value;
  latest = value;
  persistMarkerLabel(label);
}

export function takeAiCourseDepartureCoords(): AiCourseDeparture | null {
  const value = pending ?? latest;
  pending = null;
  return value;
}

export function getLatestAiCourseDepartureCoords(): AiCourseDeparture | null {
  return latest;
}

export function saveAiCourseDepartureForJob(jobId: string, departure: AiCourseDeparture): void {
  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) return;
  departureByJobId.set(trimmedJobId, departure);
}

export function readAiCourseDepartureForJob(jobId: string): AiCourseDeparture | null {
  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) return null;
  return departureByJobId.get(trimmedJobId) ?? null;
}

export function saveAiCourseDepartureForCourse(
  courseId: number,
  departure: AiCourseDeparture,
): void {
  if (courseId <= 0) return;
  departureByCourseId.set(courseId, departure);
}

export function readAiCourseDepartureForCourse(courseId: number): AiCourseDeparture | null {
  if (courseId <= 0) return null;
  return departureByCourseId.get(courseId) ?? null;
}

export function getAiCourseDepartureMarkerLabel(): string | null {
  if (latest?.markerLabel?.trim()) return latest.markerLabel.trim();
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY);
}

export function resolveAiCourseDeparturePoint(options: {
  courseId?: number | null;
  departureLatitude?: number | null;
  departureLongitude?: number | null;
  /** 생성 직후 등 API 좌표가 아직 없을 때 jobId 캐시 조회 */
  jobId?: string | null;
  /** dev fallback 등 courseId 없는 미리보기 */
  allowLatestFallback?: boolean;
}): AiCourseDeparturePoint | null {
  const {
    courseId,
    departureLatitude,
    departureLongitude,
    jobId,
    allowLatestFallback = false,
  } = options;

  if (hasValidCoords(departureLatitude, departureLongitude)) {
    const cached = courseId ? readAiCourseDepartureForCourse(courseId) : null;
    return {
      lat: departureLatitude as number,
      lng: departureLongitude as number,
      label: cached?.markerLabel?.trim() || getAiCourseDepartureMarkerLabel() || "출발지",
    };
  }

  if (courseId) {
    const stored = readAiCourseDepartureForCourse(courseId);
    if (stored) return toDeparturePoint(stored);
  }

  if (jobId) {
    const stored = readAiCourseDepartureForJob(jobId);
    if (stored) return toDeparturePoint(stored);
  }

  if (allowLatestFallback) {
    const stored = getLatestAiCourseDepartureCoords();
    if (stored) return toDeparturePoint(stored);
  }

  return null;
}

export function clearAiCourseDepartureCoords(): void {
  pending = null;
  latest = null;
  departureByJobId.clear();
  departureByCourseId.clear();
  if (typeof sessionStorage !== "undefined") {
    clearLegacyPersistedCoords();
    sessionStorage.removeItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY);
  }
}
