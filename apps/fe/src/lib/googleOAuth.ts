import { exchangeSocialLogin } from "@/lib/exchangeSocialLogin";
import {
  clearOAuthSession,
  savePostLoginRedirect,
  stateStorageKey,
  verifierStorageKey,
} from "@/lib/socialOAuthStorage";
import { googleOAuthRedirectUri } from "@/utils/frontBase";
import { deriveCodeChallengeS256, generateCodeVerifier } from "@/utils/pkce";

const PREFIX = "google";
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function randomHexState(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isClientIdConfigured(raw: string | undefined): boolean {
  const id = raw?.trim() ?? "";
  return id.length > 0 && id !== "구글_CLIENT_ID";
}

export function readGooglePkceSession(): { codeVerifier: string; state: string } | null {
  const codeVerifier = sessionStorage.getItem(verifierStorageKey(PREFIX));
  const state = sessionStorage.getItem(stateStorageKey(PREFIX));
  if (!codeVerifier) return null;
  return { codeVerifier, state: state ?? "" };
}

export function clearGoogleOAuthSession(): void {
  clearOAuthSession(PREFIX);
}

export async function startGoogleLogin(postLoginRedirect?: string): Promise<void> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!isClientIdConfigured(clientId)) {
    window.alert(
      import.meta.env.PROD
        ? "구글 로그인 설정이 배포에 포함되지 않았습니다. GitHub Secrets의 VITE_GOOGLE_CLIENT_ID와 FE 배포 워크플로를 확인해 주세요."
        : "구글 로그인을 쓰려면 `.env.local`에 `VITE_GOOGLE_CLIENT_ID`를 넣어 주세요.",
    );
    return;
  }

  const redirectUri = googleOAuthRedirectUri();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await deriveCodeChallengeS256(codeVerifier);
  const state = randomHexState();

  sessionStorage.setItem(verifierStorageKey(PREFIX), codeVerifier);
  sessionStorage.setItem(stateStorageKey(PREFIX), state);
  savePostLoginRedirect(PREFIX, postLoginRedirect);

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });

  window.location.assign(`${GOOGLE_AUTHORIZE_URL}?${params.toString()}`);
}

export function exchangeGoogleSocialLogin(params: {
  code: string;
  codeVerifier: string;
  state?: string;
}): ReturnType<typeof exchangeSocialLogin> {
  return exchangeSocialLogin("GOOGLE", {
    code: params.code,
    redirectUri: googleOAuthRedirectUri(),
    codeVerifier: params.codeVerifier,
    state: params.state,
  });
}
