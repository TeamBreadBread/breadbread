import { getStoredAccessToken } from "@/api/auth";

export function isLoggedIn(): boolean {
  return Boolean(getStoredAccessToken()?.trim());
}
