import { hasUserPreferenceSaved } from "@/api/user";
import { refreshProfileCacheFromServer } from "@/lib/userProfileCache";
import type { PostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { loginFlowTime, loginFlowTimeEnd } from "@/lib/auth/loginFlowTiming";

type NavigateFn = (options: { to: string; search?: Record<string, unknown> }) => Promise<void>;

async function navigateToPostLoginRedirect(
  navigate: NavigateFn,
  postLogin: PostLoginRedirectPath,
): Promise<void> {
  loginFlowTime("navigate");
  if (postLogin === "/bbangteo-board-write") {
    await navigate({ to: postLogin, search: { editId: 0 } });
  } else {
    await navigate({ to: postLogin });
  }
  loginFlowTimeEnd("navigate");
}

async function navigateToDefaultAfterLogin(
  navigate: NavigateFn,
  hasPreference: boolean,
): Promise<void> {
  loginFlowTime("navigate");
  if (hasPreference) {
    await navigate({ to: "/home" });
  } else {
    await navigate({ to: "/user-preference", search: { mode: "create" } });
  }
  loginFlowTimeEnd("navigate");
}

/** 프로필 캐시 갱신과 선호도 조회(필요 시)를 병렬로 처리한 뒤 이동합니다. */
export async function finishLoginAndNavigate(
  navigate: NavigateFn,
  postLogin: PostLoginRedirectPath | undefined,
): Promise<void> {
  if (postLogin) {
    loginFlowTime("refreshProfileCacheFromServer");
    await refreshProfileCacheFromServer();
    loginFlowTimeEnd("refreshProfileCacheFromServer");
    await navigateToPostLoginRedirect(navigate, postLogin);
    return;
  }

  loginFlowTime("post-login-parallel");
  try {
    const [, hasPreference] = await Promise.all([
      refreshProfileCacheFromServer(),
      hasUserPreferenceSaved(),
    ]);
    loginFlowTimeEnd("post-login-parallel");
    await navigateToDefaultAfterLogin(navigate, hasPreference);
  } catch {
    loginFlowTimeEnd("post-login-parallel");
    await navigateToDefaultAfterLogin(navigate, false);
  }
}
