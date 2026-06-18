import { setSessionTokens, type TokenResponse } from "@/api/auth";
import { markGa4FirstActionAfterLoginPending } from "@/lib/analytics/gtag";
import { onAuthSessionEstablished } from "@/lib/fcm/setupFcm";
import { finishLoginAndNavigate } from "@/lib/auth/resolvePostLoginRoute";
import { consumePostLoginRedirect } from "@/lib/socialOAuthStorage";

type NavigateFn = (options: { to: string; search?: Record<string, unknown> }) => Promise<void>;

/** 소셜 로그인 토큰 저장 후 공통 라우팅 */
export async function completeSocialLogin(
  tokens: TokenResponse,
  navigate: NavigateFn,
  storagePrefix: string,
): Promise<void> {
  const postLogin = consumePostLoginRedirect(storagePrefix);
  setSessionTokens(tokens);
  markGa4FirstActionAfterLoginPending();
  onAuthSessionEstablished();
  await finishLoginAndNavigate(navigate, postLogin);
}
