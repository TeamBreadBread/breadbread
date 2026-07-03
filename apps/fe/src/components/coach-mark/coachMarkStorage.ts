/** localStorage — Coach Mark 완료(건너뛰기·시작하기) 사용자 식별 */
export const COACH_MARK_COMPLETED_KEY = "COACH_MARK_COMPLETED";

export function readCoachMarkCompletedUserId(): number | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(COACH_MARK_COMPLETED_KEY);
  if (!raw?.trim()) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function isCoachMarkCompletedForUser(userId: number | null | undefined): boolean {
  if (userId == null || userId <= 0) return false;
  return readCoachMarkCompletedUserId() === userId;
}

export function markCoachMarkCompleted(userId: number): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(COACH_MARK_COMPLETED_KEY, String(userId));
}

export function clearCoachMarkCompleted(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(COACH_MARK_COMPLETED_KEY);
}
