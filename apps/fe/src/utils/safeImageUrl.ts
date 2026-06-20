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

/** `URL.createObjectURL`로 만든 로컬 미리보기 blob URL만 허용합니다. */
export function getSafeBlobPreviewUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "blob:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function resolveSafeImageSrc(url?: string): string | undefined {
  return getSafeImageUrl(url) ?? getSafeBlobPreviewUrl(url);
}
