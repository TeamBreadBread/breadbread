import { useEffect, useMemo, useState } from "react";
import { getMyProfile } from "@/api/user";
import { getDisplayNameForLoginId, getUserProfile, saveUserProfile } from "@/lib/userProfileCache";
import { AppTopBar } from "@/components/common";
import MyLevelCard from "@/components/domain/my/MyLevelCard";
import MyMenuSection from "@/components/domain/my/MyMenuSection";
import MyProfileCard from "@/components/domain/my/MyProfileCard";
import type { MyMenu } from "@/components/domain/my/types";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { useNavigate } from "@tanstack/react-router";

export default function MyPage() {
  const navigate = useNavigate();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profile, setProfile] = useState(() => getUserProfile());
  const displayName = useMemo(() => {
    if (profile?.name?.trim()) return profile.name.trim();
    if (profile?.loginId?.trim()) return getDisplayNameForLoginId(profile.loginId);
    return "회원";
  }, [profile]);
  const displayEmail = profile?.email?.trim() || "";
  const goToAccountSettings = () => navigate({ to: "/account-settings" });

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        setIsProfileLoading(true);
        const me = await getMyProfile();
        if (!mounted) return;
        const nextProfile = {
          loginId: me.loginId,
          name: me.name,
          email: me.email ?? "",
          phone: me.phone ?? "",
        };
        saveUserProfile(nextProfile);
        setProfile(nextProfile);
      } catch {
        // ignore and use cached profile
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    };
    void fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const activityMenus: MyMenu[] = [
    {
      id: "preference",
      label: "내 선호도 조회/수정",
      onClick: () => navigate({ to: "/user-preference", search: { mode: "edit" } }),
    },
    { id: "my-routes", label: "내 루트 목록", onClick: () => navigate({ to: "/route" }) },
    { id: "reservation", label: "예약 내역", onClick: () => navigate({ to: "/my-reservations" }) },
    { id: "review", label: "내가 쓴 리뷰" },
    { id: "badge", label: "획득한 뱃지" },
  ];

  const settingMenus: MyMenu[] = [
    { id: "account", label: "계정 설정", onClick: goToAccountSettings },
    { id: "service", label: "서비스 설정" },
    { id: "support", label: "고객센터" },
  ];

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar title="MY" onBack={() => navigate({ to: "/home" })} />

        <div className="flex flex-1 flex-col pb-[calc(56px+30px)] sm:pb-[calc(72px+30px)]">
          <div className="bg-white">
            <MyProfileCard
              nickname={displayName}
              email={isProfileLoading ? "불러오는 중..." : displayEmail || "—"}
              onClick={goToAccountSettings}
            />

            <MyLevelCard
              level="Lv.1"
              title="갓 반죽 상태"
              description="2번 더 뭐뭐하면 다음 등급 혜택을 받을 수 있어요!"
              progressPercent={70}
            />
          </div>

          <div className="mt-[10px]">
            <MyMenuSection items={activityMenus} />
          </div>
          <div className="mt-[10px]">
            <MyMenuSection items={settingMenus} />
          </div>

          <button
            type="button"
            className="mt-[20px] self-center font-pretendard typo-t4medium text-[#868b94] underline decoration-[#868b94] underline-offset-4"
          >
            로그아웃
          </button>
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
