import { getStoredAccessToken } from "@/api/auth";
import { registerFcmToken } from "@/api/notifications";
import { getFirebaseVapidKey, isFcmConfigured } from "@/lib/firebase/config";
import { obtainFcmMessaging, registerFcmServiceWorker } from "@/lib/firebase/messaging";

let registerInFlight: Promise<void> | null = null;

/**
 * 로그인 직후·앱 기동 시 FCM 토큰을 발급해 `POST /notifications/fcm-token` 으로 등록합니다.
 * 알림 권한 거부·VAPID 미설정 시 조용히 건너뜁니다.
 */
export function registerFcmAfterLogin(): Promise<void> {
  if (!getStoredAccessToken()) {
    return Promise.resolve();
  }
  if (registerInFlight) {
    return registerInFlight;
  }

  registerInFlight = (async () => {
    if (!isFcmConfigured()) {
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      return;
    }

    const vapidKey = getFirebaseVapidKey();
    if (!vapidKey) return;

    const registration = await registerFcmServiceWorker();
    const messaging = await obtainFcmMessaging();
    if (!messaging) return;

    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return;

    await registerFcmToken({ token });
  })().finally(() => {
    registerInFlight = null;
  });

  return registerInFlight;
}
