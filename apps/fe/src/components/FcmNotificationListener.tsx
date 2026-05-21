import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { getStoredAccessToken } from "@/api/auth";
import { bootstrapFcm } from "@/lib/fcm/setupFcm";

/** 앱 루트에서 FCM 토큰 등록·알림 클릭 라우팅을 초기화합니다. */
export default function FcmNotificationListener() {
  const router = useRouter();

  useEffect(() => {
    if (!getStoredAccessToken()) return;
    bootstrapFcm(router);
  }, [router]);

  return null;
}
