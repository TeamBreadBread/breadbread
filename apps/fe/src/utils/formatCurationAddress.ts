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
