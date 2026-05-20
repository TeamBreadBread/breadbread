import type { KakaoSearchPlace } from "@/lib/kakaoPlaceSearch";

/** 화면·최근검색에 쓰는 한 줄 라벨 (네이버 지도 현재위치 스타일). */
export function formatDeparturePlaceDisplay(place: KakaoSearchPlace): string {
  const address = place.address.trim();
  if (address) return address;
  return place.name.trim();
}

/** 예전 `(lat, lng)` / `이름 · 주소` 형식 정리 */
export function normalizeDepartureLabel(raw: string): string {
  let label = raw.trim();
  label = label.replace(/\s*\([-.\d]+,\s*[-.\d]+\)\s*$/, "").trim();

  const dot = label.indexOf(" · ");
  if (dot > 0) {
    const left = label.slice(0, dot).trim();
    const right = label.slice(dot + 3).trim();
    if (/(특별|광역)?[가-힣]+시|[가-힣]+구|[가-힣]+군/.test(right)) return right;
    if (/(특별|광역)?[가-힣]+시|[가-힣]+구|[가-힣]+군/.test(left)) return left;
    return right || left;
  }

  return label;
}
