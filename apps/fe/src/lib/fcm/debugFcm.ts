/* eslint-disable no-console -- DEV 전용 FCM 콘솔 테스트 */
import { getFirebaseVapidKey, isFcmConfigured } from "@/lib/firebase/config";
import { obtainFcmMessaging, registerFcmServiceWorker } from "@/lib/firebase/messaging";

/**
 * 로컬 개발용 FCM 토큰 발급 테스트.
 * 브라우저 콘솔: `await __testFcm()`
 */
export async function debugFcmToken(): Promise<string | null> {
  const vapidFromEnv = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const vapidResolved = getFirebaseVapidKey();
  console.log("VAPID (import.meta.env):", vapidFromEnv);
  console.log("VAPID (resolved):", vapidResolved ? `${vapidResolved.slice(0, 12)}…` : undefined);
  console.log("isFcmConfigured:", isFcmConfigured());

  if (!isFcmConfigured()) {
    console.warn(
      "VITE_FIREBASE_VAPID_KEY 가 번들에 없습니다. .env.local 저장 후 터미널에서 dev 서버를 Ctrl+C로 끄고 `pnpm dev`를 다시 실행하세요. (HMR만으로는 env가 갱신되지 않습니다)",
    );
    return null;
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Notification API 를 사용할 수 없습니다.");
    return null;
  }

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  console.log("Notification.permission:", permission);
  if (permission !== "granted") {
    console.warn("알림 권한이 거부되었습니다.");
    return null;
  }

  const vapidKey = getFirebaseVapidKey();
  if (!vapidKey) return null;

  const registration = await registerFcmServiceWorker();
  const messaging = await obtainFcmMessaging();
  if (!messaging) {
    console.warn("이 브라우저/환경에서는 FCM 을 지원하지 않습니다.");
    return null;
  }

  const { getToken } = await import("firebase/messaging");
  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    console.log("FCM Token:", token);
    return token;
  } catch (err) {
    console.error("getToken 실패:", err);
    return null;
  }
}

declare global {
  interface Window {
    __testFcm?: typeof debugFcmToken;
  }
}

export function exposeFcmDebugOnWindow(): void {
  window.__testFcm = debugFcmToken;
  console.info("[FCM] Dev 테스트: 콘솔에서 `await __testFcm()` 실행 (로그인·알림 허용 후)");
}
