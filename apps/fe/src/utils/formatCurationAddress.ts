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
