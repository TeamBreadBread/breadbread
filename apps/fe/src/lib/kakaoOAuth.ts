import { socialLogin, type TokenResponse } from "@/api/auth";
import { tryPostLoginRedirectPath, type PostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { kakaoOAuthRedirectUri } from "@/utils/frontBase";
import { deriveCodeChallengeS256, generateCodeVerifier } from "@/utils/pkce";

/** React Strict Mode 등으로 동일 인가 코드가 두 번 교환되는 것 방지 */
const kakaoSocialLoginInflight = new Map<string, Promise<TokenResponse>>();

const STORAGE_VERIFIER_KEY = "breadbread_oauth_kakao_code_verifier";
const STORAGE_STATE_KEY = "breadbread_oauth_kakao_state";
const STORAGE_POST_LOGIN_REDIRECT_KEY = "breadbread_oauth_kakao_post_login_redirect";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

function randomHexState(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** `.env.development` 기본 플레이스홀더 등 — 실키가 아니면 카카오로 보내지 않음 */
function isKakaoClientIdConfigured(raw: string | undefined): boolean {
  const id = raw?.trim() ?? "";
  if (!id) return false;
  if (id === "카카오_REST_API_KEY") return false;
  return true;
}

export function readKakaoPkceSession(): { codeVerifier: string; state: string } | null {
  const codeVerifier = sessionStorage.getItem(STORAGE_VERIFIER_KEY);
  const state = sessionStorage.getItem(STORAGE_STATE_KEY);
  if (!codeVerifier) return null;
  return { codeVerifier, state: state ?? "" };
}

export function clearKakaoPkceSession(): void {
  sessionStorage.removeItem(STORAGE_VERIFIER_KEY);
  sessionStorage.removeItem(STORAGE_STATE_KEY);
}

export function clearKakaoOAuthSession(): void {
  clearKakaoPkceSession();
  sessionStorage.removeItem(STORAGE_POST_LOGIN_REDIRECT_KEY);
}

export function consumeKakaoPostLoginRedirect(): PostLoginRedirectPath | undefined {
  const raw = sessionStorage.getItem(STORAGE_POST_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(STORAGE_POST_LOGIN_REDIRECT_KEY);
  return tryPostLoginRedirectPath(raw ?? undefined);
}

/** 카카오 인가 페이지로 리다이렉트 (PKCE S256). */
export async function startKakaoLogin(postLoginRedirect?: string): Promise<void> {
  const clientIdRaw = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!isKakaoClientIdConfigured(clientIdRaw)) {
    window.alert(
      import.meta.env.PROD
        ? "카카오 로그인 설정이 배포에 포함되지 않았습니다. GitHub Secrets의 VITE_KAKAO_REST_API_KEY를 확인해 주세요."
        : "카카오 로그인을 쓰려면 `.env.local`의 `VITE_KAKAO_REST_API_KEY`에 카카오 REST API 키를 넣어 주세요.",
    );
    return;
  }

  const clientId = clientIdRaw!.trim();
  const redirectUri = kakaoOAuthRedirectUri();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await deriveCodeChallengeS256(codeVerifier);
  const state = randomHexState();

  sessionStorage.setItem(STORAGE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(STORAGE_STATE_KEY, state);

  const returnPath = tryPostLoginRedirectPath(postLoginRedirect);
  if (returnPath) {
    sessionStorage.setItem(STORAGE_POST_LOGIN_REDIRECT_KEY, returnPath);
  } else {
    sessionStorage.removeItem(STORAGE_POST_LOGIN_REDIRECT_KEY);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope: "profile_nickname account_email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${KAKAO_AUTHORIZE_URL}?${params.toString()}`);
}

/** 백엔드 `POST /auth/social/KAKAO` — 동일 `code` 는 한 번만 호출 */
export function exchangeKakaoSocialLogin(params: {
  code: string;
  codeVerifier: string;
  state?: string;
}): Promise<TokenResponse> {
  const redirectUri = kakaoOAuthRedirectUri();
  const cacheKey = `${params.code}:${redirectUri}`;
  const existing = kakaoSocialLoginInflight.get(cacheKey);
  if (existing) return existing;

  const promise = socialLogin("KAKAO", {
    code: params.code,
    redirectUri,
    codeVerifier: params.codeVerifier,
    state: params.state,
  }).finally(() => {
    kakaoSocialLoginInflight.delete(cacheKey);
  });

  kakaoSocialLoginInflight.set(cacheKey, promise);
  return promise;
}
