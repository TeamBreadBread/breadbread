import type { appRouter } from "@/lib/appRouter";

type AppRouter = typeof appRouter;

export type FcmNotificationData = {
  type?: string;
  courseId?: string;
  reservationId?: string;
};

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function tourPath(courseId: number): string {
  return `/tour?courseId=${courseId}`;
}

/** FCM `data` → 앱 내 경로 (알림 클릭·딥링크용) */
export function buildPathFromFcmData(data: FcmNotificationData): string | null {
  if (data.type === "AI_COURSE") {
    const courseId = parsePositiveInt(data.courseId);
    if (courseId != null) {
      return `/ai-search-result?courseId=${courseId}`;
    }
  }

  if (data.type === "PAYMENT") {
    const reservationId = parsePositiveInt(data.reservationId);
    if (reservationId != null) {
      return `/my-reservation-detail?id=${reservationId}`;
    }
  }

  const courseId = parsePositiveInt(data.courseId);
  if (courseId != null) {
    if (
      data.type === "TOUR_START" ||
      data.type === "TEN_MIN_BEFORE" ||
      data.type === "CONGESTION_ALERT"
    ) {
      return tourPath(courseId);
    }
  }

  if (
    data.type === "TODAY_TOUR" ||
    data.type === "ONE_HOUR_BEFORE" ||
    data.type === "TEN_MIN_BEFORE" ||
    data.type === "TOUR_START" ||
    data.type === "CONGESTION_ALERT"
  ) {
    return "/home";
  }

  return null;
}

export function navigateFromFcmData(
  router: AppRouter,
  raw: Record<string, string | undefined>,
): boolean {
  const data: FcmNotificationData = {
    type: raw.type,
    courseId: raw.courseId,
    reservationId: raw.reservationId,
  };

  if (data.type === "AI_COURSE") {
    const courseId = parsePositiveInt(data.courseId);
    if (courseId != null) {
      void router.navigate({ to: "/ai-search-result", search: { courseId } });
      return true;
    }
  }

  if (data.type === "PAYMENT") {
    const id = parsePositiveInt(data.reservationId);
    if (id != null) {
      void router.navigate({ to: "/my-reservation-detail", search: { id } });
      return true;
    }
  }

  const courseId = parsePositiveInt(data.courseId);
  if (courseId != null) {
    if (
      data.type === "TOUR_START" ||
      data.type === "TEN_MIN_BEFORE" ||
      data.type === "CONGESTION_ALERT"
    ) {
      void router.navigate({ to: "/tour", search: { courseId } });
      return true;
    }
  }

  if (
    data.type === "TODAY_TOUR" ||
    data.type === "ONE_HOUR_BEFORE" ||
    data.type === "TEN_MIN_BEFORE" ||
    data.type === "TOUR_START" ||
    data.type === "CONGESTION_ALERT"
  ) {
    void router.navigate({ to: "/home" });
    return true;
  }

  return false;
}

/**
 * FCM 예약/투어 알림 타입 (BE ReservationDailyService / ReservationRealTimeService)
 * - TODAY_TOUR: 당일 예약 알림 (BE 09:00 발송)
 * - ONE_HOUR_BEFORE: 출발 1시간 전
 * - TEN_MIN_BEFORE: 출발 10분 전
 * - TOUR_START: 출발 시각 투어 자동 시작
 * - CONGESTION_ALERT: 혼잡 알림 (POST /notifications/curator)
 *
 * 앱이 포그라운드/백그라운드일 때는 FCM 수신 후 위 경로로 이동하고,
 * BreadBotWidget의 in-app 알림과 중복되지 않도록 localStorage dedup을 함께 사용합니다.
 */
