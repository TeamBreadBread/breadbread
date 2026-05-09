import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { BottomDoubleCTA } from "@/components/common";
import FindIdSuccessSection from "@/components/domain/auth/FindIdSuccessSection";
import MobileFrame from "@/components/layout/MobileFrame";

const findIdResultRouteApi = getRouteApi("/find-id-result");

export default function FindIdResultPage() {
  const { name, loginId } = findIdResultRouteApi.useSearch();
  const navigate = useNavigate();

  const displayName = name?.trim() || "회원";
  const foundId = loginId?.trim() ?? "";

  const handleFindPasswordClick = () => {
    void navigate({ to: "/find-password" });
  };

  const handleLoginClick = () => {
    void navigate({ to: "/login", search: { redirect: undefined } });
  };

  return (
    <MobileFrame>
      <FindIdSuccessSection name={displayName} userId={foundId} />

      <BottomDoubleCTA
        leftText="비밀번호 찾기"
        rightText="로그인 하러가기"
        onLeftClick={handleFindPasswordClick}
        onRightClick={handleLoginClick}
      />
    </MobileFrame>
  );
}
