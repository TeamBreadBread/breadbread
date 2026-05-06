/** `VITE_FRONT_BASE_URL`(배포) 또는 브라우저 오리진(로컬 기본). */
export function getFrontBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_FRONT_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function kakaoOAuthRedirectUri(): string {
  return `${getFrontBaseUrl()}/auth/kakao/callback`;
}
