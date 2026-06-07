function normalizeCityToken(token: string): string {
  return token
    .replace(/특별자치도$/, "")
    .replace(/특별자치시$/, "")
    .replace(/특별시$/, "")
    .replace(/광역시$/, "");
}

/**
 * 큐레이션 카드용 주소: "대전 유성구 문화원로 77"처럼 앞쪽 토큰만 남깁니다.
 * (건물명·층·호 등 뒤쪽 상세는 생략)
 * maxTokens=2이면 "대전 서구"처럼 시·구만 표시합니다.
 */
export function formatCurationAddress(full: string, maxTokens = 4): string {
  const t = full.trim();
  if (!t) return full;
  const parts = t.split(/\s+/).filter(Boolean);
  const sliced = parts.length <= maxTokens ? parts : parts.slice(0, maxTokens);
  if (sliced.length === 0) return t;
  sliced[0] = normalizeCityToken(sliced[0] ?? "");
  return sliced.join(" ");
}

/**
 * 주소에서 행정동(읍/면/동) 토큰만 추출합니다.
 * 예: "대전 동구 소제동 100-1" -> "소제동", "대전 중구 은행동123" -> "은행동".
 * 도로명 주소처럼 동 정보가 없으면 null을 반환합니다.
 * ("구"로 끝나는 자치구 토큰은 동이 아니므로 제외)
 */
export function extractDong(full: string): string | null {
  const t = full?.trim();
  if (!t) return null;
  for (const raw of t.split(/\s+/).filter(Boolean)) {
    // "은행동123-4"처럼 붙은 지번은 숫자 이후를 제거
    const token = raw.replace(/[0-9].*$/, "");
    if (token.length >= 2 && /(동|읍|면)$/.test(token)) {
      return token;
    }
  }
  return null;
}

/**
 * 도로명에서 행정동을 유추합니다.
 * 예: "둔산대로 123" -> "둔산동", "문화원로77" -> "문화원동", "변정4길 30" -> "변동"
 */
/** 도로명 어근 → 행정동 (도로명과 동 이름 철자가 다른 경우) */
const ROAD_BASE_TO_DONG: Record<string, string> = {
  변정: "변동",
};

function inferDongFromRoadToken(raw: string): string | null {
  const roadMatch = raw.match(/^(.+?)(?:대로\d*길|대로|로\d*길|\d*길|로)$/);
  if (!roadMatch?.[1]) return null;

  const base = roadMatch[1].replace(/[0-9].*$/, "");
  if (base.length < 2 || /(구|시|군|읍|면|동)$/.test(base)) return null;

  return ROAD_BASE_TO_DONG[base] ?? `${base}동`;
}

export function extractDongFromRoad(full: string): string | null {
  const t = full?.trim();
  if (!t) return null;

  for (const raw of t.split(/\s+/).filter(Boolean)) {
    const fromRaw = inferDongFromRoadToken(raw);
    if (fromRaw) return fromRaw;

    const withoutTrailingNumber = raw.replace(/\d+[-\d]*$/, "");
    if (withoutTrailingNumber !== raw) {
      const fromTrimmed = inferDongFromRoadToken(withoutTrailingNumber);
      if (fromTrimmed) return fromTrimmed;
    }
  }

  return null;
}

/**
 * 상호명에서 행정동을 유추합니다.
 * 예: "캘리포니아 베이커리&카페 둔산본점" -> "둔산동"
 */
export function extractDongFromBakeryName(name: string): string | null {
  const t = name?.trim();
  if (!t) return null;

  const inName = extractDong(t);
  if (inName) return inName;

  const branchMatch = t.match(/([가-힣]{2,6})(?:본점|지점|점)(?:\s|$|[^가-힣])/);
  const branch = branchMatch?.[1];
  if (branch && !/(구|시|군|읍|면|동)$/.test(branch)) {
    return `${branch}동`;
  }

  return null;
}

/** Google Places 등에서 내려오는 영문 행정동(예: Dunsan-dong) → 한글 */
const ROMANIZED_DONG_ALIASES: Record<string, string> = {
  "dunsan-dong": "둔산동",
  "eunhaeng-dong": "은행동",
  "soje-dong": "소제동",
  "seonhwa-dong": "선화동",
  "byeondong-dong": "변동",
  "byeonjeong-dong": "변동",
  "yongam-dong": "용암동",
  "tanbang-dong": "탄방동",
  "gung-dong": "궁동",
  "wolpyeong-dong": "월평동",
  "gujeuk-dong": "구즉동",
  "yongjeong-dong": "용전동",
  "singi-dong": "신기동",
  "bongmyeong-dong": "봉명동",
  "bongmyong-dong": "봉명동",
  "sintanjin-dong": "신탄진동",
  "daedeok-dong": "대덕동",
  "oe-dong": "외동",
};

function toRomanizedDongKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function isRomanizedDongLabel(value: string): boolean {
  return /^[a-z][a-z-]*-dong$/i.test(value.trim());
}

/** 주소·문장 속 영문 행정동(예: Bongmyeong-dong) 추출 후 한글 변환 */
function extractRomanizedDongFromText(text: string): string | null {
  for (const match of text.matchAll(/\b([A-Za-z][A-Za-z-]*-dong)\b/gi)) {
    const normalized = normalizeDongLabel(match[1]);
    if (normalized) return normalized;
  }
  return null;
}

export function normalizeDongLabel(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/[가-힣]/.test(trimmed)) {
    const dong = extractDong(trimmed);
    return dong ?? trimmed;
  }

  const key = toRomanizedDongKey(trimmed);
  if (ROMANIZED_DONG_ALIASES[key]) return ROMANIZED_DONG_ALIASES[key];

  const suffixMatch = key.match(/^([a-z-]+)-dong$/);
  if (suffixMatch?.[1]) {
    const withSuffix = `${suffixMatch[1]}-dong`;
    if (ROMANIZED_DONG_ALIASES[withSuffix]) return ROMANIZED_DONG_ALIASES[withSuffix];
  }

  return null;
}

/** 썸네일·큐레이션 카드용 주소 — 행정동(00동) 우선, 없으면 전체 주소 */
export function resolveThumbnailDongAddress(
  full: string | undefined | null,
  apiDong?: string | null,
  bakeryName?: string | null,
): string {
  const trimmed = full?.trim();
  if (trimmed) {
    const dong = extractDong(trimmed);
    if (dong) return dong;

    const fromRoad = extractDongFromRoad(trimmed);
    if (fromRoad) return fromRoad;

    const fromRomanizedInAddress = extractRomanizedDongFromText(trimmed);
    if (fromRomanizedInAddress) return fromRomanizedInAddress;

    if (isRomanizedDongLabel(trimmed)) {
      const normalizedWhole = normalizeDongLabel(trimmed);
      if (normalizedWhole) return normalizedWhole;
    }
  }

  const normalizedApiDong = normalizeDongLabel(apiDong);
  if (normalizedApiDong) return normalizedApiDong;

  const fromName = extractDongFromBakeryName(bakeryName ?? "");
  if (fromName) return fromName;

  if (trimmed && isRomanizedDongLabel(trimmed)) {
    return normalizeDongLabel(trimmed) ?? "";
  }

  return trimmed ?? "";
}
