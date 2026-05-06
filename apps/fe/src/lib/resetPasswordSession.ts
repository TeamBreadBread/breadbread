const KEY = "breadbread_reset_pw_context";

export type ResetPasswordSessionPayload = {
  verificationToken: string;
  name: string;
};

export function saveResetPasswordSession(payload: ResetPasswordSessionPayload): void {
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadResetPasswordSession(): ResetPasswordSessionPayload | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "verificationToken" in parsed &&
      "name" in parsed &&
      typeof (parsed as ResetPasswordSessionPayload).verificationToken === "string" &&
      typeof (parsed as ResetPasswordSessionPayload).name === "string"
    ) {
      return parsed as ResetPasswordSessionPayload;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearResetPasswordSession(): void {
  sessionStorage.removeItem(KEY);
}
