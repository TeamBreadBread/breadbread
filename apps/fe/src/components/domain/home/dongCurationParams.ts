/** 홈 동 큐레이션에서 고를 수 있는 행정동 */
import {
  extractDong,
  normalizeDongLabel,
  resolveThumbnailDongAddress,
} from "@/utils/formatCurationAddress";

export const DONG_OPTIONS = [
  "소제동",
  "은행동",
  "선화동",
  "대흥동",
  "둔산동",
  "봉명동",
  "갈마동",
  "탄방동",
] as const;

export type DongOption = (typeof DONG_OPTIONS)[number];

/** 홈 동 큐레이션 — `dong` 필터 결과가 없을 때 쓰는 지역구(`region`) 보완 */
export const DONG_REGION_FALLBACK: Record<string, string> = {
  소제동: "대전 동구",
  은행동: "대전 중구",
  선화동: "대전 중구",
  대흥동: "대전 중구",
  둔산동: "대전 서구",
  봉명동: "대전 유성구",
  갈마동: "대전 서구",
  탄방동: "대전 서구",
};

/** 행정동 → 소속 자치구 (주소 구 불일치 시 제외용) */
const DONG_DISTRICT: Record<DongOption, string> = {
  소제동: "동구",
  은행동: "중구",
  선화동: "중구",
  대흥동: "중구",
  둔산동: "서구",
  봉명동: "유성구",
  갈마동: "서구",
  탄방동: "서구",
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

  return false;
}

/** 동 큐레이션·목록에서 해당 행정동 빵집인지 판별합니다. */
export function bakeryBelongsToDong(
  bakery: { address?: string | null; dong?: string | null; name?: string },
  targetDong: string,
  options?: { allowRegionFallback?: boolean },
): boolean {
  const expected = targetDong.trim();
  if (!expected) return true;
  if (shouldExcludeFromDongCuration(bakery, expected)) return false;

  if (normalizeDongLabel(bakery.dong) === expected) return true;

  const explicitDong = bakery.address ? extractDong(bakery.address.trim()) : null;
  if (explicitDong === expected) return true;

  const resolved = resolveThumbnailDongAddress(bakery.address, bakery.dong, bakery.name);
  if (resolved === expected) return true;

  if (options?.allowRegionFallback) {
    return bakeryMatchesDongForRegionFallback(bakery, expected);
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
const HOME_CURATION_SEED_KEY = "bbang_home_curation_seed";

/** React Strict Mode 등에서 홈 방문 초기화가 연속 호출될 때 재사용합니다. */
const HOME_VISIT_DEDUPE_MS = 100;
let lastHomeVisitAt = 0;
let lastHomeVisitSnapshot: { seed: number; dong: DongOption } | null = null;

function readLastDong(): string | null {
  try {
    return sessionStorage.getItem(LAST_DONG_KEY);
  } catch {
    return null;
  }
}

function writeLastDong(dong: DongOption): void {
  try {
    sessionStorage.setItem(LAST_DONG_KEY, dong);
  } catch {
    /* sessionStorage 불가 시에도 랜덤 선택은 유지 */
  }
}

function bumpHomeCurationSeedOnce(): number {
  try {
    const next = (Number(sessionStorage.getItem(HOME_CURATION_SEED_KEY)) || 0) + 1;
    sessionStorage.setItem(HOME_CURATION_SEED_KEY, String(next));
    return next;
  } catch {
    return Date.now();
  }
}

/**
 * 홈 진입 시 노출할 동을 랜덤 선택합니다.
 * 직전 홈에서 본 동은 제외해, 연속 방문 시에도 섞이도록 합니다.
 */
export function pickRandomDong(): DongOption {
  const last = readLastDong();
  const candidates = DONG_OPTIONS.filter((d) => d !== last);
  const pool = candidates.length > 0 ? candidates : [...DONG_OPTIONS];
  const next = pool[Math.floor(Math.random() * pool.length)]!;
  writeLastDong(next);
  return next;
}

export type HomeCurationVisit = {
  seed: number;
  dong: DongOption;
};

/** 다른 탭으로 나갔다가 다시 홈으로 올 때 이전 방문 스냅샷을 비웁니다. */
export function resetHomeCurationVisitDedupe(): void {
  lastHomeVisitAt = 0;
  lastHomeVisitSnapshot = null;
}

/**
 * 홈 큐레이션·동 큐레이션을 방문마다 한 번만 초기화합니다.
 * (Strict Mode 이중 마운트·useState+effect 중복 호출 방지)
 */
export function beginHomeCurationVisit(): HomeCurationVisit {
  const now = Date.now();
  if (lastHomeVisitSnapshot && now - lastHomeVisitAt < HOME_VISIT_DEDUPE_MS) {
    return lastHomeVisitSnapshot;
  }

  const snapshot: HomeCurationVisit = {
    seed: bumpHomeCurationSeedOnce(),
    dong: pickRandomDong(),
  };
  lastHomeVisitAt = now;
  lastHomeVisitSnapshot = snapshot;
  return snapshot;
}
