import { searchKakaoPlacesByKeyword } from "@/lib/kakaoPlaceSearch";

/** `(37.5665, 126.978)` 형태 좌표가 있으면 파싱, 없으면 서울 시청 근처 기본값 */
export function parseLatLngFromPlace(value: string): { lat: number; lng: number } {
  return parseLatLngFromPlaceOrNull(value) ?? { lat: 37.5665, lng: 126.978 };
}

/** `(37.5665, 126.978)` 형태 좌표가 있으면 파싱, 없으면 null */
export function parseLatLngFromPlaceOrNull(value: string): { lat: number; lng: number } | null {
  const m = value.match(/\(([-\d.]+)\s*,\s*([-\d.]+)\)/);
  if (!m) return null;
  const lat = Number.parseFloat(m[1]);
  const lng = Number.parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** 괄호 안 좌표 표기를 제거한 출발지 라벨 */
export function formatDeparturePlaceLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\s*\([-\d.]+\s*,\s*[-\d.]+\)\s*$/, "").trim() || trimmed;
}

/** 출발지 문자열에서 좌표를 찾고, 없으면 카카오 검색으로 지오코딩 */
export async function resolveDepartureCoordinates(
  departure: string,
): Promise<{ lat: number; lng: number }> {
  const parsed = parseLatLngFromPlaceOrNull(departure);
  if (parsed) return parsed;

  const keyword = formatDeparturePlaceLabel(departure);
  if (keyword) {
    const places = await searchKakaoPlacesByKeyword(keyword);
    const first = places[0];
    if (first && Number.isFinite(first.lat) && Number.isFinite(first.lng)) {
      return { lat: first.lat, lng: first.lng };
    }
  }

  throw new Error("출발지 좌표를 찾을 수 없습니다. 주소를 다시 선택해주세요.");
}

/** 상세 조회 시 저장된 출발지에서 좌표를 복원(파싱 또는 지오코딩) */
export async function loadDepartureCoordinates(
  departure: string,
): Promise<{ lat: number; lng: number } | null> {
  const parsed = parseLatLngFromPlaceOrNull(departure);
  if (parsed) return parsed;

  const keyword = formatDeparturePlaceLabel(departure);
  if (!keyword) return null;

  try {
    const places = await searchKakaoPlacesByKeyword(keyword);
    const first = places[0];
    if (first && Number.isFinite(first.lat) && Number.isFinite(first.lng)) {
      return { lat: first.lat, lng: first.lng };
    }
  } catch {
    /* 지오코딩 실패 시 저장 시 재시도 */
  }
  return null;
}
