import { refreshProfileCacheFromServer } from "@/lib/userProfileCache";
import type { PostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { loginFlowTime, loginFlowTimeEnd } from "@/lib/auth/loginFlowTiming";
import {
  invalidatePreferenceOnboardingCache,
  PREFERENCE_ONBOARDING_PATH,
  PREFERENCE_ONBOARDING_SEARCH,
  resolveHasPreferenceForLogin,
} from "@/lib/auth/preferenceOnboardingGate";

type NavigateFn = (options: {
  to: string;
  search?: Record<string, unknown>;
  replace?: boolean;
}) => Promise<void>;

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

async function navigateToPreferenceOnboarding(navigate: NavigateFn): Promise<void> {
  loginFlowTime("navigate");
  await navigate({
    to: PREFERENCE_ONBOARDING_PATH,
    search: PREFERENCE_ONBOARDING_SEARCH,
    replace: true,
  });
  loginFlowTimeEnd("navigate");
}

async function navigateToHome(navigate: NavigateFn): Promise<void> {
  loginFlowTime("navigate");
  await navigate({ to: "/home" });
  loginFlowTimeEnd("navigate");
}

/** 프로필 캐시 갱신과 선호도 조회(필요 시)를 병렬로 처리한 뒤 이동합니다. */
export async function finishLoginAndNavigate(
  navigate: NavigateFn,
  postLogin: PostLoginRedirectPath | undefined,
): Promise<void> {
  loginFlowTime("post-login-parallel");
  invalidatePreferenceOnboardingCache();
  const [, hasPreference] = await Promise.all([
    refreshProfileCacheFromServer(),
    resolveHasPreferenceForLogin(),
  ]);
  loginFlowTimeEnd("post-login-parallel");

  if (!hasPreference) {
    await navigateToPreferenceOnboarding(navigate);
    return;
  }

  if (postLogin) {
    await navigateToPostLoginRedirect(navigate, postLogin);
    return;
  }

  await navigateToHome(navigate);
}
