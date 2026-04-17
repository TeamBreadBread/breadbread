import MobileFrame from "@/components/layout/MobileFrame";
import { BottomCTA } from "@/components/common";
import PasswordResetSuccessSection from "@/components/domain/auth/PasswordResetSuccessSection";
import { useNavigate } from "@tanstack/react-router";

export default function PasswordResetSuccessPage() {
  const navigate = useNavigate();
  const handleGoLogin = () => {
    navigate({ to: "/login" });
  };

  return (
    <MobileFrame>
      <PasswordResetSuccessSection
        title="비밀번호 변경 완료"
        description={"비밀번호 변경이 완료되었습니다.\n새로운 비밀번호로 로그인해주세요."}
      />

      <BottomCTA text="로그인 하러가기" onClick={handleGoLogin} />
    </MobileFrame>
  );
}
