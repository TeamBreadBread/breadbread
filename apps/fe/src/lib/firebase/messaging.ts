import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { firebaseWebConfig } from "@/lib/firebase/config";

const FCM_SW_PATH = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;
const APP_SW_PATH = `${import.meta.env.BASE_URL}sw.js`;

let firebaseApp: FirebaseApp | undefined;
let messagingSupported: boolean | undefined;

function getOrInitFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;
  const existing = getApps()[0];
  firebaseApp = existing ?? initializeApp(firebaseWebConfig);
  return firebaseApp;
}

export async function isFirebaseMessagingSupported(): Promise<boolean> {
  if (messagingSupported !== undefined) return messagingSupported;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    messagingSupported = false;
    return false;
  }
  try {
    const { isSupported } = await import("firebase/messaging");
    messagingSupported = await isSupported();
  } catch {
    messagingSupported = false;
  }
  return messagingSupported;
}

export async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration> {
  // DEV 에서는 PWA `sw.js` 가 없으므로 기존 FCM 전용 SW 로 직접 테스트합니다.
  if (import.meta.env.DEV) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const existing = registrations.find((reg) =>
      reg.active?.scriptURL.includes("firebase-messaging-sw.js"),
    );
    if (existing?.active) {
      return existing;
    }
    return navigator.serviceWorker.register(FCM_SW_PATH);
  }

  // PROD 에서는 root scope 를 잡는 PWA `sw.js` 하나만 사용하고,
  // FCM background 처리는 `sw.js` 가 import 한 스크립트에서 처리합니다.
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    return existing;
  }
  return navigator.serviceWorker.register(APP_SW_PATH);
}

export async function obtainFcmMessaging() {
  if (!(await isFirebaseMessagingSupported())) {
    return null;
  }
  const app = getOrInitFirebaseApp();
  const { getMessaging } = await import("firebase/messaging");
  return getMessaging(app);
}
