import type { TourCurrentResponse } from "@/api/tours";

export const TOUR_STATE_UPDATED_EVENT = "breadbot:tour-state-updated";

/** 투어 방문·완료 후 챗봇 투어 탭 ↔ /tour 전체 화면 상태 동기화 */
export function publishTourStateUpdate(tour: TourCurrentResponse): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_STATE_UPDATED_EVENT, { detail: { tour } }));
}

export function subscribeTourStateUpdate(
  listener: (tour: TourCurrentResponse) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const tour = (event as CustomEvent<{ tour?: TourCurrentResponse }>).detail?.tour;
    if (tour) listener(tour);
  };

  window.addEventListener(TOUR_STATE_UPDATED_EVENT, handler);
  return () => window.removeEventListener(TOUR_STATE_UPDATED_EVENT, handler);
}
