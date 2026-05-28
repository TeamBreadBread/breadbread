/** 로그인 성공 후 `?redirect=` 로 복귀할 수 있는 경로 (오픈 리다이렉트 방지) */
const ALLOWED_POST_LOGIN_PATHS = [
  "/home",
  "/preference",
  "/recommendation",
  "/bbangteo-board-write",
  "/my",
  "/route",
  "/bbangteo",
  "/ai-search-result",
] as const;

export type PostLoginRedirectPath = (typeof ALLOWED_POST_LOGIN_PATHS)[number];

export function parseLoginRedirectPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return undefined;
  if (trimmed.includes("?") || trimmed.includes("#") || trimmed.includes("://")) {
    return undefined;
  }
  return trimmed;
}

export function tryPostLoginRedirectPath(
  redirect: string | undefined,
): PostLoginRedirectPath | undefined {
  const parsed = parseLoginRedirectPath(redirect);
  if (!parsed) return undefined;
  if ((ALLOWED_POST_LOGIN_PATHS as readonly string[]).includes(parsed)) {
    return parsed as PostLoginRedirectPath;
  }
  return undefined;
}
