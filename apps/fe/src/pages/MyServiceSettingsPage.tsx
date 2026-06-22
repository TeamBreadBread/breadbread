import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, ToastBanner } from "@/components/common";
import SettingsLinkRow from "@/components/domain/my/SettingsLinkRow";
import SettingsSection from "@/components/domain/my/SettingsSection";
import SettingsToggleRow from "@/components/domain/my/SettingsToggleRow";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useComingSoonToast } from "@/hooks/useComingSoonToast";
import { performLogout } from "@/lib/auth/performLogout";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

export default function MyServiceSettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSetting } = useAppSettings();
  const { toastMessage, showComingSoon } = useComingSoonToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) return;
    if (!window.confirm("로그아웃할까요?")) return;
    setIsLoggingOut(true);
    void performLogout(navigate).finally(() => setIsLoggingOut(false));
  };

  const handleWithdraw = () => {
    if (!window.confirm("회원 탈퇴를 진행할까요?")) return;
    showComingSoon("회원 탈퇴 기능은 준비 중이에요.");
  };

  return (
    <MobileFrame>
      <div className="relative flex flex-1 flex-col bg-[#f3f4f5] dark:bg-[#14181c]">
        <AppTopBar title="서비스 설정" onBack={() => navigate({ to: "/my" })} />

        <div className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+24px)] sm:pb-[calc(72px+24px)]">
          <SettingsSection title="알림 설정" description="빵투어와 예약 관련 알림을 관리해요.">
            <SettingsToggleRow
              label="빵투어 시작 알림"
              checked={settings.tourStartNotification}
              onChange={(checked) => updateSetting("tourStartNotification", checked)}
            />
            <SettingsToggleRow
              label="예약 코스 알림"
              checked={settings.reservationNotification}
              onChange={(checked) => updateSetting("reservationNotification", checked)}
            />
            <SettingsToggleRow
              label="코스 도착 알림"
              checked={settings.arrivalNotification}
              onChange={(checked) => updateSetting("arrivalNotification", checked)}
            />
            <SettingsToggleRow
              label="마케팅/이벤트 알림"
              checked={settings.marketingNotification}
              onChange={(checked) => updateSetting("marketingNotification", checked)}
            />
          </SettingsSection>

          <SettingsSection title="화면 설정">
            <SettingsToggleRow
              label="다크모드 전환"
              description="어두운 배경으로 눈의 피로를 줄여요."
              checked={settings.darkMode}
              onChange={(checked) => updateSetting("darkMode", checked)}
            />
          </SettingsSection>

          <SettingsSection title="위치 설정" description="위치 기반 추천과 자동 반영을 설정해요.">
            <SettingsToggleRow
              label="위치 기반 추천 사용"
              checked={settings.locationRecommendation}
              onChange={(checked) => updateSetting("locationRecommendation", checked)}
            />
            <SettingsToggleRow
              label="현재 위치 자동 반영"
              checked={settings.autoCurrentLocation}
              onChange={(checked) => updateSetting("autoCurrentLocation", checked)}
            />
          </SettingsSection>

          <SettingsSection title="추천 설정" description="코스 추천 방식을 조정해요.">
            <SettingsLinkRow
              label="내 선호도 다시 설정하기"
              description="빵 취향 조사를 다시 진행해요."
              onClick={() => navigate({ to: "/user-preference", search: { mode: "edit" } })}
            />
            <SettingsToggleRow
              label="혼잡도 높은 빵집 제외하기"
              checked={settings.excludeCrowdedBakery}
              onChange={(checked) => updateSetting("excludeCrowdedBakery", checked)}
            />
            <SettingsToggleRow
              label="영업 중인 빵집 우선 추천"
              checked={settings.openBakeryFirst}
              onChange={(checked) => updateSetting("openBakeryFirst", checked)}
            />
          </SettingsSection>

          <SettingsSection title="계정 설정">
            <SettingsLinkRow
              label={isLoggingOut ? "로그아웃 중…" : "로그아웃"}
              onClick={handleLogout}
            />
            <SettingsLinkRow label="회원 탈퇴" danger onClick={handleWithdraw} />
          </SettingsSection>
        </div>

        {toastMessage ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(56px+16px)] z-[120] mx-auto max-w-[402px] px-x4">
            <ToastBanner message={toastMessage} />
          </div>
        ) : null}
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
