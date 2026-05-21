import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { firebaseWebConfig } from "@/lib/firebase/config";

const FCM_SW_PATH = "/firebase-messaging-sw.js";

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
  const registrations = await navigator.serviceWorker.getRegistrations();
  const existing = registrations.find((reg) =>
    reg.active?.scriptURL.includes("firebase-messaging-sw.js"),
  );
  if (existing?.active) {
    return existing;
  }
  return navigator.serviceWorker.register(FCM_SW_PATH);
}

export async function obtainFcmMessaging() {
  if (!(await isFirebaseMessagingSupported())) {
    return null;
  }
  const app = getOrInitFirebaseApp();
  const { getMessaging } = await import("firebase/messaging");
  return getMessaging(app);
}
