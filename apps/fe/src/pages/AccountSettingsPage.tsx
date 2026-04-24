import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/common/navigation/BottomNav";
import AccountActionSection from "@/components/domain/account/AccountActionSection";
import AccountInfoSection from "@/components/domain/account/AccountInfoSection";
import AccountProfileSection from "@/components/domain/account/AccountProfileSection";
import type { AccountInfo } from "@/components/domain/account/types";
import MobileFrame from "@/components/layout/MobileFrame";
import { useNavigate } from "@tanstack/react-router";

const profileItems: AccountInfo[] = [
  { id: "name", label: "이름", value: "유민진" },
  { id: "nickname", label: "닉네임", value: "노릇노릇한 소금빵" },
  { id: "email", label: "이메일", value: "breadbread@bread.com" },
  { id: "phone", label: "전화번호", value: "010-1234-1234" },
];

const paymentItems: AccountInfo[] = [{ id: "payment", label: "결제 수단 관리" }];

const accountItems: AccountInfo[] = [
  { id: "password", label: "비밀번호 변경" },
  { id: "withdraw", label: "회원 탈퇴", danger: true },
];

export default function AccountSettingsPage() {
  const navigate = useNavigate();

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="계정 설정"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/" })}
        />

        <div className="flex flex-1 flex-col gap-[10px]">
          <div className="bg-white">
            <AccountProfileSection />
            <AccountInfoSection items={profileItems} />
          </div>

          <AccountActionSection items={paymentItems} />
          <AccountActionSection items={accountItems} />
        </div>
      </div>

      <BottomNav
        items={[
          { label: "홈" },
          { label: "루트" },
          { label: "빵터" },
          { label: "MY", active: true },
        ]}
      />
    </MobileFrame>
  );
}
