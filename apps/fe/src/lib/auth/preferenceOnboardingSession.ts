const MANDATORY_ONBOARDING_KEY = "breadbread_mandatory_preference_onboarding";
const HOME_PROMPT_DISMISSED_KEY = "breadbread_preference_home_prompt_dismissed";

/** 회원가입 직후 첫 로그인 — 선호도 조사 필수(건너뛰기 없음) */
export function markMandatoryPreferenceOnboarding(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(MANDATORY_ONBOARDING_KEY, "1");
}

export function isMandatoryPreferenceOnboarding(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(MANDATORY_ONBOARDING_KEY) === "1";
}

export function clearMandatoryPreferenceOnboarding(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(MANDATORY_ONBOARDING_KEY);
}

/** 홈 선호도 안내 팝업 — 세션 내 '닫기' */
export function dismissHomePreferencePrompt(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(HOME_PROMPT_DISMISSED_KEY, "1");
}

export function isHomePreferencePromptDismissed(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(HOME_PROMPT_DISMISSED_KEY) === "1";
}

export function clearHomePreferencePromptDismissed(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(HOME_PROMPT_DISMISSED_KEY);
}
