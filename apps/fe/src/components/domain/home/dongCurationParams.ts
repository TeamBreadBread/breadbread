/** 홈 동 큐레이션에서 고를 수 있는 행정동 */
import {
  extractDong,
  extractDongFromRoad,
  normalizeDongLabel,
} from "@/utils/formatCurationAddress";

export const DONG_OPTIONS = ["소제동", "은행동"] as const;

export type DongOption = (typeof DONG_OPTIONS)[number];

/** 홈 동 큐레이션 — `dong` 필터 결과가 없을 때 쓰는 지역구(`region`) 보완 */
export const DONG_REGION_FALLBACK: Record<string, string> = {
  소제동: "대전 동구",
  은행동: "대전 중구",
};

/** 행정동 → 소속 자치구 (주소 구 불일치 시 제외용) */
const DONG_DISTRICT: Record<DongOption, string> = {
  소제동: "동구",
  은행동: "중구",
};

const DISTRICT_TOKENS = ["동구", "중구", "서구", "유성구", "대덕구"] as const;

/**
 * 동 큐레이션에서 빼야 할 빵집인지 판별합니다.
 * API `dong` 필터 결과는 기본 신뢰하고, 명백히 다른 동·구만 제외합니다.
 */
export function shouldExcludeFromDongCuration(
  bakery: { address?: string | null; dong?: string | null; name?: string },
  targetDong: string,
): boolean {
  const expected = targetDong.trim();
  if (!expected) return false;

  const address = bakery.address?.trim() ?? "";
  const normalizedApiDong = normalizeDongLabel(bakery.dong);
  const expectedGu = DONG_DISTRICT[expected as DongOption];

  if (expectedGu && address) {
    for (const gu of DISTRICT_TOKENS) {
      if (gu !== expectedGu && address.includes(gu)) {
        return true;
      }
    }
  }

  const explicitDong = address ? extractDong(address) : null;
  if (explicitDong && explicitDong !== expected) {
    return true;
  }

  if (normalizedApiDong === expected) {
    return false;
  }

  const roadDong = address ? extractDongFromRoad(address) : null;
  if (roadDong && roadDong !== expected) {
    return true;
  }

  return false;
}

/** region fallback 목록에서 해당 동 후보만 남깁니다 */
export function bakeryMatchesDongForRegionFallback(
  bakery: { address?: string | null; dong?: string | null; name?: string },
  targetDong: string,
): boolean {
  const expected = targetDong.trim();
  if (!expected) return true;
  if (shouldExcludeFromDongCuration(bakery, expected)) return false;

  const normalizedApiDong = normalizeDongLabel(bakery.dong);
  if (normalizedApiDong === expected) return true;

  const explicitDong = bakery.address ? extractDong(bakery.address.trim()) : null;
  if (explicitDong === expected) return true;

  const expectedGu = DONG_DISTRICT[expected as DongOption];
  if (expectedGu && bakery.address?.includes(expectedGu)) return true;

  return false;
}

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
