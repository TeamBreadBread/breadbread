import type { GetBakeriesParams } from "@/api/types/bakery";

/** 홈·빵터 큐레이션 기본 요청 — `displayCount`가 더 크면 컴포넌트에서 size만 늘립니다 */
export const CURATION_BAKERY_LIST_PARAMS = {
  page: 0,
  size: 8,
  sort: "RATING" as const,
  open: false,
} satisfies GetBakeriesParams;

/** 홈 큐레이션 등 기본 노출 장수 */
export const CURATION_DISPLAY_COUNT = 4;

/** 빵터 탭 큐레이션 문구 섹션 */
export const CURATION_BBANGTEO_DISPLAY_COUNT = 6;

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
