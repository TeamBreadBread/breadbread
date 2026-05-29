import type { BakeryListItem } from "@/api/types/bakery";

/** 주소·이름에 동 이름이 있으면 우선 매칭, 없으면 대전 데이터 기준 구 단위로 보완 */
export function bakeryMatchesDong(bakery: BakeryListItem, dong: string): boolean {
  const haystack = `${bakery.name ?? ""} ${bakery.address ?? ""}`;
  if (haystack.includes(dong)) return true;

  if (dong === "소제동") {
    return haystack.includes("유성구");
  }
  if (dong === "은행동") {
    return haystack.includes("중구") && !haystack.includes("유성");
  }

  return false;
}
