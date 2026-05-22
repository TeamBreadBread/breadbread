import { tryPostLoginRedirectPath, type PostLoginRedirectPath } from "@/lib/postLoginRedirect";

export function postLoginStorageKey(prefix: string): string {
  return `breadbread_oauth_${prefix}_post_login_redirect`;
}

export function stateStorageKey(prefix: string): string {
  return `breadbread_oauth_${prefix}_state`;
}

export function verifierStorageKey(prefix: string): string {
  return `breadbread_oauth_${prefix}_code_verifier`;
}

export function savePostLoginRedirect(prefix: string, postLoginRedirect?: string): void {
  const returnPath = tryPostLoginRedirectPath(postLoginRedirect);
  const key = postLoginStorageKey(prefix);
  if (returnPath) {
    sessionStorage.setItem(key, returnPath);
  } else {
    sessionStorage.removeItem(key);
  }
}

export function consumePostLoginRedirect(prefix: string): PostLoginRedirectPath | undefined {
  const key = postLoginStorageKey(prefix);
  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  return tryPostLoginRedirectPath(raw ?? undefined);
}

export function clearOAuthSession(prefix: string): void {
  sessionStorage.removeItem(verifierStorageKey(prefix));
  sessionStorage.removeItem(stateStorageKey(prefix));
  sessionStorage.removeItem(postLoginStorageKey(prefix));
}
