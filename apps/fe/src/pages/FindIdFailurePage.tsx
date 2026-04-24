import { useNavigate } from "@tanstack/react-router";
import { BottomDoubleCTA, StatusBar } from "@/components/common";
import AuthTextLink from "@/components/domain/auth/AuthTextLink";
import FindIdFailureSection from "@/components/domain/auth/FindIdFailureSection";
import MobileFrame from "@/components/layout/MobileFrame";

export default function FindIdFailurePage() {
  const navigate = useNavigate();

  const handleGoLogin = () => {
    navigate({ to: "/login" });
  };

  const handleSignup = () => {
    // TODO: 회원가입 페이지 이동
  };

  const handleRetryFindId = () => {
    navigate({ to: "/find-id" });
  };

  return (
    <MobileFrame>
      <StatusBar />

      <main className="flex flex-1 flex-col items-center gap-x6 pt-[156px]">
        <FindIdFailureSection
          title={"요청하신 정보와\n일치하는 아이디가 없습니다."}
          description={
            "입력하신 이름이나 휴대폰 번호를 다시 확인해주세요.\n아직 회원이 아니시라면 회원가입을 할 수 있어요."
          }
        />

        <AuthTextLink text="로그인 화면으로 돌아가기" onClick={handleGoLogin} />
      </main>

      <BottomDoubleCTA
        leftText="회원가입 하기"
        rightText="아이디 다시 찾기"
        onLeftClick={handleSignup}
        onRightClick={handleRetryFindId}
      />
    </MobileFrame>
  );
}
