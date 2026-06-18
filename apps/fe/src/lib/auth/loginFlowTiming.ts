/* eslint-disable no-console -- DEV 카카오/소셜 로그인 지연 진단용 */
const ENABLED = import.meta.env.DEV;

export function loginFlowTime(label: string): void {
  if (ENABLED) console.time(label);
}

export function loginFlowTimeEnd(label: string): void {
  if (ENABLED) console.timeEnd(label);
}

export function loginFlowLog(message: string, detail?: unknown): void {
  if (!ENABLED) return;
  if (detail === undefined) {
    console.info(`[login-flow] ${message}`);
    return;
  }
  console.info(`[login-flow] ${message}`, detail);
}
