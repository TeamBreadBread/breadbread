/** 로그인 없이 접근 가능한 경로 */
const PUBLIC_ROUTE_EXACT = new Set([
  "/",
  "/login-entry",
  "/login",
  "/signup",
  "/signup-result",
  "/find-id",
  "/find-id-result",
  "/find-id-failure",
  "/find-password",
  "/reset-password",
  "/password-reset-success",
]);

const PUBLIC_ROUTE_PREFIXES = ["/auth/", "/payment/portone-redirect"] as const;

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTE_EXACT.has(pathname)) return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}
