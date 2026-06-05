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
 * 예: "둔산대로 123" -> "둔산동", "문화원로77" -> "문화원동"
 */
export function extractDongFromRoad(full: string): string | null {
  const t = full?.trim();
  if (!t) return null;

  for (const raw of t.split(/\s+/).filter(Boolean)) {
    const token = raw.replace(/[0-9].*$/, "");
    const roadMatch = token.match(/^(.+?)(?:대로\d*길|대로|로\d*길|길)$/);
    if (!roadMatch?.[1]) continue;

    const base = roadMatch[1];
    if (base.length < 2 || /(구|시|군|읍|면|동)$/.test(base)) continue;
    return `${base}동`;
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

/** 썸네일·큐레이션 카드용 주소 — 행정동(00동) 우선, 없으면 전체 주소 */
export function resolveThumbnailDongAddress(
  full: string | undefined | null,
  apiDong?: string | null,
  bakeryName?: string | null,
): string {
  const dongFromApi = apiDong?.trim();
  if (dongFromApi) return dongFromApi;

  const trimmed = full?.trim();
  if (trimmed) {
    const dong = extractDong(trimmed);
    if (dong) return dong;

    const fromRoad = extractDongFromRoad(trimmed);
    if (fromRoad) return fromRoad;
  }

  const fromName = extractDongFromBakeryName(bakeryName ?? "");
  if (fromName) return fromName;

  return trimmed ?? "";
}
