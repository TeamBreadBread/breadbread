export const TOUR_COMPLETE_CELEBRATION_KEY = "breadbot:tourCompletePending";
export const TOUR_COMPLETE_EVENT = "breadbot:tour-complete";

export function markTourCompleteCelebration(courseId: number): void {
  if (courseId <= 0) return;
  try {
    sessionStorage.setItem(TOUR_COMPLETE_CELEBRATION_KEY, String(courseId));
  } catch {
    /* ignore */
  }
}

export function notifyTourCompleteCelebration(courseId: number): void {
  markTourCompleteCelebration(courseId);
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_COMPLETE_EVENT, { detail: { courseId } }));
}

export function readPendingTourCompleteCelebration(): number | null {
  try {
    const raw = sessionStorage.getItem(TOUR_COMPLETE_CELEBRATION_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingTourCompleteCelebration(): void {
  try {
    sessionStorage.removeItem(TOUR_COMPLETE_CELEBRATION_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated 축하 확인(ack) 시에만 사용 */
export function consumeTourCompleteCelebration(): number | null {
  const pending = readPendingTourCompleteCelebration();
  if (pending != null) clearPendingTourCompleteCelebration();
  return pending;
}
