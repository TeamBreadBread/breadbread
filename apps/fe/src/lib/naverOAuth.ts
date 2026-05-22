import { issueNaverState } from "@/api/auth";
import { exchangeSocialLogin } from "@/lib/exchangeSocialLogin";
import {
  clearOAuthSession,
  savePostLoginRedirect,
  stateStorageKey,
} from "@/lib/socialOAuthStorage";
import { naverOAuthRedirectUri } from "@/utils/frontBase";

const PREFIX = "naver";
const NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";

function isClientIdConfigured(raw: string | undefined): boolean {
  const id = raw?.trim() ?? "";
  return id.length > 0 && id !== "네이버_CLIENT_ID";
}

export function readNaverOAuthSession(): { state: string } | null {
  const state = sessionStorage.getItem(stateStorageKey(PREFIX));
  if (!state) return null;
  return { state };
}

export function clearNaverOAuthSession(): void {
  clearOAuthSession(PREFIX);
}

export async function startNaverLogin(postLoginRedirect?: string): Promise<void> {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID?.trim();
  if (!isClientIdConfigured(clientId)) {
    window.alert(
      import.meta.env.PROD
        ? "네이버 로그인 설정이 배포에 포함되지 않았습니다. GitHub Secrets의 VITE_NAVER_CLIENT_ID를 확인해 주세요."
        : "네이버 로그인을 쓰려면 `.env.local`에 `VITE_NAVER_CLIENT_ID`를 넣어 주세요.",
    );
    return;
  }

  let state: string;
  try {
    state = await issueNaverState();
  } catch {
    window.alert("네이버 로그인 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  sessionStorage.setItem(stateStorageKey(PREFIX), state);
  savePostLoginRedirect(PREFIX, postLoginRedirect);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    redirect_uri: naverOAuthRedirectUri(),
    state,
  });

  window.location.assign(`${NAVER_AUTHORIZE_URL}?${params.toString()}`);
}

export function exchangeNaverSocialLogin(params: {
  code: string;
  state: string;
}): ReturnType<typeof exchangeSocialLogin> {
  return exchangeSocialLogin("NAVER", {
    code: params.code,
    redirectUri: naverOAuthRedirectUri(),
    state: params.state,
  });
}
