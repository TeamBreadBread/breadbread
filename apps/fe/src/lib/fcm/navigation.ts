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

  return false;
}
