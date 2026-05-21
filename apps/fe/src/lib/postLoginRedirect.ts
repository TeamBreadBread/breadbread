/** 로그인 성공 후 `?redirect=` 로 복귀할 수 있는 경로 (오픈 리다이렉트 방지) */
const ALLOWED_POST_LOGIN_PATHS = [
  "/home",
  "/preference",
  "/recommendation",
  "/bbangteo-board-write",
] as const;

export type PostLoginRedirectPath = (typeof ALLOWED_POST_LOGIN_PATHS)[number];

export function tryPostLoginRedirectPath(
  redirect: string | undefined,
): PostLoginRedirectPath | undefined {
  if (!redirect) return undefined;
  if ((ALLOWED_POST_LOGIN_PATHS as readonly string[]).includes(redirect)) {
    return redirect as PostLoginRedirectPath;
  }
  return undefined;
}
