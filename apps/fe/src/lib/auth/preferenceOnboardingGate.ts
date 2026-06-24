import { redirect } from "@tanstack/react-router";

import { hasUserPreferenceSaved } from "@/api/user";

import { isLoggedIn } from "./isLoggedIn";
import { isPublicPath } from "./publicRoutes";
import { isMandatoryPreferenceOnboarding } from "./preferenceOnboardingSession";

/** 선호도 조사(Onboarding) 페이지 — BE `GET /users/preference`와 대응 */
export const PREFERENCE_ONBOARDING_PATH = "/user-preference" as const;

export const PREFERENCE_ONBOARDING_SEARCH = { mode: "create" as const };

const PATH_PREFIXES_EXEMPT_FROM_GATE = ["/auth/", "/payment/portone-redirect"] as const;

let cachedHasPreference: boolean | null = null;
let cacheUpdatedAt = 0;
let inflightPreferenceCheck: Promise<boolean> | null = null;

const PREFERENCE_CACHE_TTL_MS = 30_000;

export function invalidatePreferenceOnboardingCache(): void {
  cachedHasPreference = null;
  cacheUpdatedAt = 0;
  inflightPreferenceCheck = null;
}

function isPathPrefixExempt(pathname: string): boolean {
  return PATH_PREFIXES_EXEMPT_FROM_GATE.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

export function isPreferenceOnboardingPath(
  pathname: string,
  search?: Record<string, unknown>,
): boolean {
  if (pathname !== PREFERENCE_ONBOARDING_PATH) return false;
  return search?.mode !== "edit";
}

export function isPathExemptFromPreferenceGate(pathname: string): boolean {
  return isPublicPath(pathname) || isPathPrefixExempt(pathname);
}

async function resolveHasPreferenceSaved(): Promise<boolean> {
  const now = Date.now();
  if (cachedHasPreference !== null && now - cacheUpdatedAt < PREFERENCE_CACHE_TTL_MS) {
    return cachedHasPreference;
  }

  if (!inflightPreferenceCheck) {
    inflightPreferenceCheck = hasUserPreferenceSaved()
      .then((hasPreference) => {
        cachedHasPreference = hasPreference;
        cacheUpdatedAt = Date.now();
        return hasPreference;
      })
      .finally(() => {
        inflightPreferenceCheck = null;
      });
  }

  return inflightPreferenceCheck;
}

/** 로그인 사용자의 선호도 미완료 시 온보딩으로 보냅니다. 완료 사용자는 create 모드 재진입을 막습니다. */
export async function ensurePreferenceOnboardingGate(
  pathname: string,
  search: Record<string, unknown>,
): Promise<void> {
  if (!isLoggedIn()) return;

  const hasPreference = await resolveHasPreferenceSaved();

  if (isPreferenceOnboardingPath(pathname, search)) {
    if (hasPreference && search.mode !== "edit") {
      throw redirect({ to: "/home" });
    }
    return;
  }

  if (isPathExemptFromPreferenceGate(pathname)) return;

  if (!hasPreference && isMandatoryPreferenceOnboarding()) {
    throw redirect({
      to: PREFERENCE_ONBOARDING_PATH,
      search: PREFERENCE_ONBOARDING_SEARCH,
    });
  }
}

export async function resolveHasPreferenceForLogin(): Promise<boolean> {
  try {
    return await resolveHasPreferenceSaved();
  } catch {
    return false;
  }
}

export async function redirectLoggedInUserFromLanding(): Promise<void> {
  if (!isLoggedIn()) return;

  const hasPreference = await resolveHasPreferenceForLogin();
  if (hasPreference) {
    throw redirect({ to: "/home" });
  }

  if (isMandatoryPreferenceOnboarding()) {
    throw redirect({
      to: PREFERENCE_ONBOARDING_PATH,
      search: PREFERENCE_ONBOARDING_SEARCH,
    });
  }

  throw redirect({ to: "/home" });
}
