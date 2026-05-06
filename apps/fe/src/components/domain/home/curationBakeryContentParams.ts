import type { GetBakeriesParams } from "@/api/types/bakery";

/** 홈·빵터 큐레이션 — 별점순 풀을 넉넉히 받아 온 뒤 클라이언트에서 4곳만 노출 */
export const CURATION_BAKERY_LIST_PARAMS = {
  page: 0,
  size: 48,
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
