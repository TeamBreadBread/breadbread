import { AppTopBar } from "@/components/common";
import AccountActionSection from "@/components/domain/account/AccountActionSection";
import AccountInfoSection from "@/components/domain/account/AccountInfoSection";
import AccountProfileSection from "@/components/domain/account/AccountProfileSection";
import type { AccountInfo } from "@/components/domain/account/types";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { getUserProfile } from "@/lib/userProfileCache";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMyProfile, type MyProfileResponse } from "@/api/user";

function formatKoreanMobile(phone: string | undefined): string {
  if (!phone || !/^010\d{8}$/.test(phone)) return "—";
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const cachedProfile = getUserProfile();
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);

  useEffect(() => {
    let active = true;
    void getMyProfile()
      .then((me) => {
        if (active) setProfile(me);
      })
      .catch(() => {
        /* keep cached values */
      });
    return () => {
      active = false;
    };
  }, []);

  const name = profile?.name?.trim() || cachedProfile?.name?.trim() || "—";
  const nickname = profile?.nickname?.trim() || "—";
  const email = profile?.email?.trim() || cachedProfile?.email?.trim() || "—";
  const phone = profile?.phone || cachedProfile?.phone;
  const profileItems: AccountInfo[] = [
    { id: "name", label: "이름", value: name, showArrow: false },
    {
      id: "nickname",
      label: "닉네임",
      value: nickname,
      onClick: () => navigate({ to: "/account-settings/profile" }),
    },
    {
      id: "email",
      label: "이메일",
      value: email,
      onClick: () => navigate({ to: "/account-settings/profile" }),
    },
    {
      id: "phone",
      label: "전화번호",
      value: formatKoreanMobile(phone),
      onClick: () => navigate({ to: "/account-settings/phone" }),
    },
  ];
  const paymentItems: AccountInfo[] = [
    { id: "payment", label: "결제 수단 관리", showArrow: false },
  ];
  const accountItems: AccountInfo[] = [
    {
      id: "password",
      label: "비밀번호 변경",
      onClick: () => navigate({ to: "/account-settings/password" }),
    },
    { id: "withdraw", label: "회원 탈퇴", danger: true, showArrow: false },
  ];

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="계정 설정"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my" })}
        />

        <div className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+8px)] sm:pb-[calc(60px+8px)]">
          <div className="bg-white">
            <AccountProfileSection />
            <AccountInfoSection items={profileItems} />
          </div>

          <AccountActionSection items={paymentItems} />
          <AccountActionSection items={accountItems} />
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
