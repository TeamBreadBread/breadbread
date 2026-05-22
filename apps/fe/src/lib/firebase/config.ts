/** Firebase 웹 앱 설정 (클라이언트 공개 값). env로 덮어쓸 수 있습니다. */
export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDgJfGsiQVxZBA9WZ1nvFGEZrIzyqSRgoQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "breadbread-494200.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "breadbread-494200",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "breadbread-494200.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "317081501838",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:317081501838:web:10f2995f323dce7b1949df",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-GZCY2K48HQ",
} as const;

export function getFirebaseVapidKey(): string | undefined {
  const key = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}

export function isFcmConfigured(): boolean {
  return Boolean(getFirebaseVapidKey());
}
