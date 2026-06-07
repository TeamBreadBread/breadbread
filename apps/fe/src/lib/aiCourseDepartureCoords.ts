/** AI 코스 출발 좌표 — 같은 탭 세션 동안 메모리에만 보관 (좌표는 sessionStorage에 저장하지 않음) */
export type AiCourseDeparture = {
  latitude: number;
  longitude: number;
  markerLabel?: string;
};

const DEPARTURE_COORDS_STORAGE_KEY = "aiCourseDepartureCoords";
const DEPARTURE_MARKER_LABEL_STORAGE_KEY = "aiCourseDepartureMarkerLabel";

let pending: AiCourseDeparture | null = null;
let latest: AiCourseDeparture | null = null;

/** 이전 버전에서 sessionStorage에 남아 있을 수 있는 좌표 평문 데이터 제거 */
function clearLegacyPersistedCoords(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(DEPARTURE_COORDS_STORAGE_KEY);
}

function persistMarkerLabel(label: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY, label);
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

export function getAiCourseDepartureMarkerLabel(): string | null {
  if (latest?.markerLabel?.trim()) return latest.markerLabel.trim();
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY);
}

export function clearAiCourseDepartureCoords(): void {
  pending = null;
  latest = null;
  if (typeof sessionStorage !== "undefined") {
    clearLegacyPersistedCoords();
    sessionStorage.removeItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY);
  }
}
