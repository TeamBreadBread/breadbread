import {
  socialLogin,
  type SsoProvider,
  type SocialLoginRequest,
  type TokenResponse,
} from "@/api/auth";

const inflight = new Map<string, Promise<TokenResponse>>();

export function exchangeSocialLogin(
  provider: SsoProvider,
  body: SocialLoginRequest,
): Promise<TokenResponse> {
  const cacheKey = `${provider}:${body.code}:${body.redirectUri}`;
  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  const promise = socialLogin(provider, body).finally(() => {
    inflight.delete(cacheKey);
  });
  inflight.set(cacheKey, promise);
  return promise;
}
