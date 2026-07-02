import { clearSessionTokens, logout } from "@/api/auth";
import { invalidatePreferenceOnboardingCache } from "@/lib/auth/preferenceOnboardingGate";
import { clearUserProfile } from "@/lib/userProfileCache";

type NavigateFn = (options: { to: string; replace?: boolean }) => void | Promise<void>;

export async function performLogout(navigate: NavigateFn): Promise<void> {
  try {
    await logout();
  } catch {
    /* 만료·서버 오류여도 로컬 세션은 정리 */
  }
  clearSessionTokens();
  invalidatePreferenceOnboardingCache();
  clearUserProfile();
  await navigate({ to: "/", replace: true });
}
