import type { MessagePayload } from "firebase/messaging";
import { appRouter } from "@/lib/appRouter";
import { navigateFromFcmData } from "@/lib/fcm/navigation";
import { registerFcmAfterLogin } from "@/lib/fcm/registerToken";
import { obtainFcmMessaging, registerFcmServiceWorker } from "@/lib/firebase/messaging";
import { isFcmConfigured } from "@/lib/firebase/config";

function dataFromPayload(payload: MessagePayload): Record<string, string | undefined> {
  const raw = payload.data ?? {};
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  );
}

function showForegroundNotification(
  payload: MessagePayload,
  onClick: (data: Record<string, string | undefined>) => void,
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const data = dataFromPayload(payload);
  const title = payload.notification?.title ?? "BreadBread";
  const body = payload.notification?.body ?? "";
  const notification = new Notification(title, { body, data });
  notification.onclick = () => {
    window.focus();
    onClick(data);
    notification.close();
  };
}

type AppRouter = typeof appRouter;

let handlersAttached = false;

/** 포그라운드 수신 처리. 백그라운드·알림 클릭은 등록된 앱 Service Worker 가 담당합니다. */
export async function setupFcmMessageHandlers(router: AppRouter): Promise<void> {
  if (!isFcmConfigured() || handlersAttached) return;
  const { isFirebaseMessagingSupported } = await import("@/lib/firebase/messaging");
  if (!(await isFirebaseMessagingSupported())) {
    return;
  }

  const messaging = await obtainFcmMessaging();
  if (!messaging) return;

  handlersAttached = true;

  await registerFcmServiceWorker();

  const { onMessage } = await import("firebase/messaging");

  onMessage(messaging, (payload) => {
    showForegroundNotification(payload, (data) => {
      navigateFromFcmData(router, data);
    });
  });
}

/** 세션 있을 때 토큰 등록 + 메시지 핸들러 연결 */
export function bootstrapFcm(router: AppRouter): void {
  void setupFcmMessageHandlers(router);
  void registerFcmAfterLogin();
}

/** 로그인·소셜 로그인 직후 호출 */
export function onAuthSessionEstablished(): void {
  void setupFcmMessageHandlers(appRouter);
  void registerFcmAfterLogin();
}
