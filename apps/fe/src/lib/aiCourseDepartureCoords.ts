/** AI 코스 출발 좌표 — 메모리 + sessionStorage(결과 화면·새로고침 복구용) */
export type AiCourseDeparture = {
  latitude: number;
  longitude: number;
  markerLabel?: string;
};

const DEPARTURE_COORDS_STORAGE_KEY = "aiCourseDepartureCoords";
const DEPARTURE_MARKER_LABEL_STORAGE_KEY = "aiCourseDepartureMarkerLabel";

let pending: AiCourseDeparture | null = null;
let latest: AiCourseDeparture | null = null;

function isValidDeparture(value: AiCourseDeparture): boolean {
  return (
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    !(value.latitude === 0 && value.longitude === 0)
  );
}

function readPersistedDeparture(): AiCourseDeparture | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEPARTURE_COORDS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AiCourseDeparture>;
    if (
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      !isValidDeparture(parsed as AiCourseDeparture)
    ) {
      return null;
    }
    const markerLabel =
      typeof parsed.markerLabel === "string" && parsed.markerLabel.trim()
        ? parsed.markerLabel.trim()
        : sessionStorage.getItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY)?.trim() || "출발지";
    return { latitude: parsed.latitude, longitude: parsed.longitude, markerLabel };
  } catch {
    return null;
  }
}

function persistDeparture(value: AiCourseDeparture): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DEPARTURE_COORDS_STORAGE_KEY, JSON.stringify(value));
  sessionStorage.setItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY, value.markerLabel?.trim() || "출발지");
}

export function setAiCourseDepartureCoords(
  latitude: number,
  longitude: number,
  markerLabel?: string,
): void {
  const value: AiCourseDeparture = {
    latitude,
    longitude,
    markerLabel: markerLabel?.trim() || "출발지",
  };
  pending = value;
  latest = value;
  persistDeparture(value);
}

export function takeAiCourseDepartureCoords(): AiCourseDeparture | null {
  const value = pending ?? latest ?? readPersistedDeparture();
  pending = null;
  return value;
}

export function getLatestAiCourseDepartureCoords(): AiCourseDeparture | null {
  return latest ?? readPersistedDeparture();
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
    sessionStorage.removeItem(DEPARTURE_COORDS_STORAGE_KEY);
    sessionStorage.removeItem(DEPARTURE_MARKER_LABEL_STORAGE_KEY);
  }
}
