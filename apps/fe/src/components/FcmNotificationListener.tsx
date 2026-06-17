import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { getStoredAccessToken } from "@/api/auth";
import { AUTH_SESSION_READY_EVENT } from "@/lib/auth/authSessionGate";
import { bootstrapFcm } from "@/lib/fcm/setupFcm";

/** 앱 루트에서 FCM 토큰 등록·알림 클릭 라우팅을 초기화합니다. */
export default function FcmNotificationListener() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(() => Boolean(getStoredAccessToken()));

  useEffect(() => {
    const syncSession = () => {
      setHasSession(Boolean(getStoredAccessToken()));
    };
    window.addEventListener(AUTH_SESSION_READY_EVENT, syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener(AUTH_SESSION_READY_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  useEffect(() => {
    if (!hasSession) return;
    bootstrapFcm(router);
  }, [hasSession, router]);

  return null;
}
