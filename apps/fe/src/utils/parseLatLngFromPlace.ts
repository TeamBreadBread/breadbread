/** `(37.5665, 126.978)` 형태 좌표가 있으면 파싱, 없으면 서울 시청 근처 기본값 */
export function parseLatLngFromPlace(value: string): { lat: number; lng: number } {
  const m = value.match(/\(([-\d.]+)\s*,\s*([-\d.]+)\)/);
  if (m) {
    const lat = Number.parseFloat(m[1]);
    const lng = Number.parseFloat(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return { lat: 37.5665, lng: 126.978 };
}
