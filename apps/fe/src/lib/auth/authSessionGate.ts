const AUTH_ESTABLISHMENT_TIMEOUT_MS = 15_000;

let pendingEstablishment: Promise<void> | null = null;
let resolveEstablishment: (() => void) | null = null;
let rejectEstablishment: ((reason?: unknown) => void) | null = null;

/** 소셜·일반 로그인 토큰 교환 시작 시 호출 — 토큰 저장 전 보호 API 요청을 잠시 대기 */
export function beginAuthEstablishment(): void {
  if (pendingEstablishment) return;
  pendingEstablishment = new Promise<void>((resolve, reject) => {
    resolveEstablishment = resolve;
    rejectEstablishment = reject;
  });
}

export function completeAuthEstablishment(): void {
  resolveEstablishment?.();
  resolveEstablishment = null;
  rejectEstablishment = null;
  pendingEstablishment = null;
}

export function abortAuthEstablishment(reason?: unknown): void {
  rejectEstablishment?.(reason ?? new Error("Auth establishment aborted"));
  resolveEstablishment = null;
  rejectEstablishment = null;
  pendingEstablishment = null;
}

/** 토큰 저장 직전에 발사된 보호 API가 401 나지 않도록 짧게 대기 */
export async function waitForAuthSessionIfPending(): Promise<void> {
  if (!pendingEstablishment) return;
  if (typeof window === "undefined") return;

  const timeout = new Promise<void>((_, reject) => {
    window.setTimeout(
      () => reject(new Error("Auth establishment timeout")),
      AUTH_ESTABLISHMENT_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([pendingEstablishment, timeout]);
  } catch {
    /* 타임아웃·취소 시 토큰 없이 진행 (기존과 동일하게 401 가능) */
  }
}

export const AUTH_SESSION_READY_EVENT = "breadbread:auth-session-ready";

export function notifyAuthSessionReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_READY_EVENT));
}
