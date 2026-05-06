import { AppTopBar } from "@/components/common";
import AccountActionSection from "@/components/domain/account/AccountActionSection";
import AccountInfoSection from "@/components/domain/account/AccountInfoSection";
import AccountProfileSection from "@/components/domain/account/AccountProfileSection";
import type { AccountInfo } from "@/components/domain/account/types";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { getUserProfile } from "@/lib/userProfileCache";
import { useNavigate } from "@tanstack/react-router";

function formatKoreanMobile(phone: string | undefined): string {
  if (!phone || !/^010\d{8}$/.test(phone)) return "—";
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

const paymentItems: AccountInfo[] = [{ id: "payment", label: "결제 수단 관리" }];

const accountItems: AccountInfo[] = [
  { id: "password", label: "비밀번호 변경" },
  { id: "withdraw", label: "회원 탈퇴", danger: true },
];

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const p = getUserProfile();
  const name = p?.name?.trim() || "—";
  const email = p?.email?.trim() || "—";
  const profileItems: AccountInfo[] = [
    { id: "name", label: "이름", value: name },
    { id: "nickname", label: "닉네임", value: "—" },
    { id: "email", label: "이메일", value: email },
    { id: "phone", label: "전화번호", value: formatKoreanMobile(p?.phone) },
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
