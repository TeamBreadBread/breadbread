import { normalizeDepartureLabel } from "@/utils/formatDeparturePlace";
import { parseLatLngFromPlaceOrNull } from "@/utils/parseLatLngFromPlace";

/** AI 선호도·택시 예약 출발지 최근 검색 공용 키 */
export const DEPARTURE_RECENT_STORAGE_KEY = "aiCourseDepartureRecent";

const LEGACY_TAXI_DEPARTURE_RECENT_KEY = "taxiReserveDepartureRecent";

export type DepartureRecentEntry = {
  label: string;
  lat: number;
  lng: number;
};

function toCoordPair(
  lat: number | undefined,
  lng: number | undefined,
): { lat: number; lng: number } | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function parseRecentEntry(item: unknown): DepartureRecentEntry | null {
  if (typeof item === "string" && item.trim()) {
    const coords = parseLatLngFromPlaceOrNull(item);
    const label = normalizeDepartureLabel(item);
    if (!label || !coords) return null;
    return { label, ...coords };
  }

  if (item && typeof item === "object" && "label" in item) {
    const row = item as DepartureRecentEntry;
    const label = normalizeDepartureLabel(String(row.label ?? ""));
    const lat = typeof row.lat === "number" ? row.lat : undefined;
    const lng = typeof row.lng === "number" ? row.lng : undefined;
    const coords = toCoordPair(lat, lng);
    if (!label || !coords) return null;
    return { label, ...coords };
  }

  return null;
}

function loadLegacyTaxiRecents(): DepartureRecentEntry[] {
  try {
    const raw = localStorage.getItem(LEGACY_TAXI_DEPARTURE_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseRecentEntry)
      .filter((entry): entry is DepartureRecentEntry => entry !== null);
  } catch {
    return [];
  }
}

export function loadDeparturePlaceRecents(): DepartureRecentEntry[] {
  try {
    const raw = localStorage.getItem(DEPARTURE_RECENT_STORAGE_KEY);
    if (!raw) return loadLegacyTaxiRecents();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return loadLegacyTaxiRecents();

    const entries = parsed
      .map(parseRecentEntry)
      .filter((entry): entry is DepartureRecentEntry => entry !== null);

    return entries.length > 0 ? entries : loadLegacyTaxiRecents();
  } catch {
    return loadLegacyTaxiRecents();
  }
}

export function saveDeparturePlaceRecents(items: DepartureRecentEntry[]): void {
  try {
    localStorage.setItem(DEPARTURE_RECENT_STORAGE_KEY, JSON.stringify(items.slice(0, 15)));
  } catch {
    /* ignore */
  }
}

export function pushDeparturePlaceRecent(
  items: DepartureRecentEntry[],
  entry: DepartureRecentEntry,
): DepartureRecentEntry[] {
  const label = normalizeDepartureLabel(entry.label);
  if (!label || !toCoordPair(entry.lat, entry.lng)) return items;
  const normalized = { label, lat: entry.lat, lng: entry.lng };
  return [normalized, ...items.filter((item) => item.label !== label)];
}
