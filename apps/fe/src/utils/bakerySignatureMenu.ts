import type { BakeryDetailBread } from "@/api/types/bakery";

/** 빵집 상세의 signature 빵 이름을 카드용 한 줄 라벨로 만듭니다. */
export function formatBakerySignatureMenuLabel(
  breads: Array<Pick<BakeryDetailBread, "name" | "signature">>,
  maxCount = 3,
): string {
  const names = breads
    .filter((bread) => bread.signature)
    .map((bread) => bread.name.trim())
    .filter(Boolean)
    .slice(0, maxCount);

  return names.join(", ");
}
