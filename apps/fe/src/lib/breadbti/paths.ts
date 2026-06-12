export const BREAD_BTI_BASE = "/breadbti";
export const BREAD_BTI_RESULT_STORAGE_KEY = "bread-mbti-result";

export function breadBtiPath(suffix = ""): string {
  if (!suffix) return BREAD_BTI_BASE;
  return suffix.startsWith("/") ? `${BREAD_BTI_BASE}${suffix}` : `${BREAD_BTI_BASE}/${suffix}`;
}

export function breadBtiAbsoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return normalized;
  return `${window.location.origin}${normalized}`;
}
