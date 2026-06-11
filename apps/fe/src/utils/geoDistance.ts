const EARTH_RADIUS_M = 6_371_000;

/** 두 좌표 사이 직선 거리(미터) — Haversine */
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 코스 빵집 도착 판정 반경(미터) */
export const TOUR_ARRIVAL_RADIUS_M = 30;
