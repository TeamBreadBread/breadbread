import type { GetBakeriesParams } from "@/api/types/bakery";

/** 홈·빵터 큐레이션 — 카드 4장만 노출하므로 풀·페이로드를 최소화 */
export const CURATION_BAKERY_LIST_PARAMS = {
  page: 0,
  size: 8,
  sort: "RATING" as const,
  open: false,
} satisfies GetBakeriesParams;

export const CURATION_DISPLAY_COUNT = 4;

export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = t;
  }
  return copy;
}
