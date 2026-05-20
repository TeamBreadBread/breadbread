import { redirect } from "@tanstack/react-router";
import { getStoredAccessToken } from "@/api/auth";

/** 보호 API 진입 전 — 액세스 토큰이 없으면 로그인으로 보냅니다. */
export function redirectToLoginIfUnauthenticated(returnPath: string): void {
  if (!getStoredAccessToken()) {
    throw redirect({
      to: "/login",
      search: { redirect: returnPath },
    });
  }
}
