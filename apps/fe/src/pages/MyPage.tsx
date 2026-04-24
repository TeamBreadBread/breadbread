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
  const goToAccountSettings = () => navigate({ to: "/account-settings" });

  const activityMenus: MyMenu[] = [
    { id: "reservation", label: "예약 내역" },
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

        <div className="flex flex-1 flex-col pb-x5">
          <div className="bg-white">
            <MyProfileCard
              nickname="노릇노릇한 소금빵"
              email="breadbread@bread.com"
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
            className="mt-[20px] self-center font-pretendard typo-t4medium text-[#868b94] underline"
          >
            로그아웃
          </button>
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
