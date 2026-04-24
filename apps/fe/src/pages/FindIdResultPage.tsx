import { useNavigate } from "@tanstack/react-router";
import { BottomDoubleCTA } from "@/components/common";
import FindIdSuccessSection from "@/components/domain/auth/FindIdSuccessSection";
import MobileFrame from "@/components/layout/MobileFrame";

export default function FindIdResultPage() {
  const userName = "유민진";
  const foundId = "breadbread";
  const navigate = useNavigate();

  const handleFindPasswordClick = () => {
    // TODO: 비밀번호 찾기 페이지 이동
  };

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  return (
    <MobileFrame>
      <FindIdSuccessSection name={userName} userId={foundId} />

      <BottomDoubleCTA
        leftText="비밀번호 찾기"
        rightText="로그인 하러가기"
        onLeftClick={handleFindPasswordClick}
        onRightClick={handleLoginClick}
      />
    </MobileFrame>
  );
}
