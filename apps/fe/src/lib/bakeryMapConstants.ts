/** 기본 지도 중심 — 대전역 (위치 권한 거부·실패 시) */
export const DEFAULT_BAKERY_MAP_CENTER = {
  lat: 36.332496,
  lng: 127.434578,
  label: "대전역",
} as const;

export const BAKERY_MAP_DEFAULT_LEVEL = 5;

export const BAKERY_MAP_FETCH_SIZE = 100;

/** 지도 모드 빵집 조회 반경(미터) — BE radiusMeters와 동일 단위 */
export const BAKERY_MAP_SEARCH_RADIUS_METERS = 5000;

export function buildBakeryMapNearbySearchParams(center: { lat: number; lng: number }) {
  return {
    sort: "NEARBY" as const,
    userLat: center.lat,
    userLng: center.lng,
    radiusMeters: BAKERY_MAP_SEARCH_RADIUS_METERS,
  };
}
