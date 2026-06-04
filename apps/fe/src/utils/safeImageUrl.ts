/**
 * 외부에서 받은 이미지 URL을 `<img src>`에 안전하게 사용하기 위한 검증 유틸.
 * `http`/`https`(또는 same-origin 상대 경로)만 허용해 `javascript:` 등 위험한 스킴을 차단한다.
 */
export function getSafeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}
