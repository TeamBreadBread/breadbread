import { setSessionTokens, type TokenResponse } from "@/api/auth";
import { onAuthSessionEstablished } from "@/lib/fcm/setupFcm";
import { hasUserPreferenceSaved } from "@/api/user";
import { refreshProfileCacheFromServer } from "@/lib/userProfileCache";
import { consumePostLoginRedirect } from "@/lib/socialOAuthStorage";
import type { PostLoginRedirectPath } from "@/lib/postLoginRedirect";

type NavigateFn = (options: { to: string; search?: Record<string, unknown> }) => Promise<void>;

async function goAfterLogin(navigate: NavigateFn, postLogin: PostLoginRedirectPath | undefined) {
  if (postLogin) {
    if (postLogin === "/bbangteo-board-write") {
      await navigate({ to: postLogin, search: { editId: 0 } });
    } else {
      await navigate({ to: postLogin });
    }
    return;
  }

  try {
    if (await hasUserPreferenceSaved()) {
      await navigate({ to: "/home" });
    } else {
      await navigate({ to: "/user-preference", search: { mode: "create" } });
    }
  } catch {
    await navigate({ to: "/user-preference", search: { mode: "create" } });
  }
}

/** 소셜 로그인 토큰 저장 후 공통 라우팅 */
export async function completeSocialLogin(
  tokens: TokenResponse,
  navigate: NavigateFn,
  storagePrefix: string,
): Promise<void> {
  const postLogin = consumePostLoginRedirect(storagePrefix);
  setSessionTokens(tokens);
  onAuthSessionEstablished();
  refreshProfileCacheFromServer();
  await goAfterLogin(navigate, postLogin);
}
