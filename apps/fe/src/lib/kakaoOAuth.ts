import { kakaoOAuthRedirectUri } from "@/utils/frontBase";
import { deriveCodeChallengeS256, generateCodeVerifier } from "@/utils/pkce";

const STORAGE_VERIFIER_KEY = "breadbread_oauth_kakao_code_verifier";
const STORAGE_STATE_KEY = "breadbread_oauth_kakao_state";

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

/** 카카오 인가 페이지로 리다이렉트 (PKCE S256). */
export async function startKakaoLogin(): Promise<void> {
  const clientIdRaw = import.meta.env.VITE_KAKAO_REST_API_KEY;
  if (!isKakaoClientIdConfigured(clientIdRaw)) {
    window.alert(
      "카카오 로그인을 쓰려면 `VITE_KAKAO_REST_API_KEY`에 카카오 개발자 콘솔 REST API 키를 넣어 주세요.",
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
