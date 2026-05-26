/** AI 코스 출발 좌표 — sessionStorage 대신 메모리에만 보관 (CodeQL 민감정보 평문 저장 회피) */
type AiCourseDeparture = {
  latitude: number;
  longitude: number;
  markerLabel?: string;
};

const DEPARTURE_MARKER_LABEL_STORAGE_KEY = "aiCourseDepartureMarkerLabel";

let pending: AiCourseDeparture | null = null;
let latest: AiCourseDeparture | null = null;

function persistMarkerLabel(markerLabel?: string): void {
  if (typeof sessionStorage === "undefined") return;
  const label = markerLabel?.trim() || "출발지";
  sessionStorage.setItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY, label);
}

export function setAiCourseDepartureCoords(
  latitude: number,
  longitude: number,
  markerLabel?: string,
): void {
  const value = { latitude, longitude, markerLabel };
  pending = value;
  latest = value;
  persistMarkerLabel(markerLabel);
}

export function takeAiCourseDepartureCoords(): AiCourseDeparture | null {
  const value = pending;
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
    sessionStorage.removeItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY);
  }
}
