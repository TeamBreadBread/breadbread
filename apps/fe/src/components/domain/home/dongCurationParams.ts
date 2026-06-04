/** 홈 동 큐레이션에서 고를 수 있는 행정동 */
export const DONG_OPTIONS = ["소제동", "은행동"] as const;

export type DongOption = (typeof DONG_OPTIONS)[number];

/** 동 큐레이션 — `dong` 필터 결과가 없을 때 쓰는 지역구(`region`) 보완 */
export const DONG_REGION_FALLBACK: Record<string, string> = {
  소제동: "대전 동구",
  은행동: "대전 중구",
};

const LAST_DONG_KEY = "bbang_home_dong";

/**
 * 홈 진입 시 노출할 동을 랜덤 선택합니다.
 * 직전 홈에서 본 동은 제외해, 연속 방문 시에도 섞이도록 합니다.
 */
export function pickRandomDong(): DongOption {
  let last: string | null = null;
  try {
    last = sessionStorage.getItem(LAST_DONG_KEY);
  } catch {
    last = null;
  }
  const candidates = DONG_OPTIONS.filter((d) => d !== last);
  const pool = candidates.length > 0 ? candidates : [...DONG_OPTIONS];
  const next = pool[Math.floor(Math.random() * pool.length)]!;
  try {
    sessionStorage.setItem(LAST_DONG_KEY, next);
  } catch {
    /* sessionStorage 불가 시에도 랜덤 선택은 유지 */
  }
  return next;
}
