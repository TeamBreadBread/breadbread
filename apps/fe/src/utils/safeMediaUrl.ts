/**
 * 미리보기 등에 쓸 object URL이 오직 브라우저 blob 스킴인지 검사합니다.
 * (CodeQL: DOM text reinterpreted as HTML — img src 등에 임의 문자열 차단)
 */
export function blobUrlForImagePreview(url: string): string | undefined {
  if (!url.startsWith("blob:")) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "blob:") {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}
