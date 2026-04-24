import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import MobileFrame from "@/components/layout/MobileFrame";
import { AppTopBar, BottomCTA } from "@/components/common";
import AuthIntroSection from "@/components/domain/auth/AuthIntroSection";
import FindPasswordFormSection from "@/components/domain/auth/FindPasswordFormSection";

export default function FindPasswordPage() {
  const navigate = useNavigate();
  const [isFormComplete, setIsFormComplete] = useState(false);
  const forceInvalidId =
    new URLSearchParams(window.location.search).get("forceInvalidId") === "true";

  return (
    <MobileFrame>
      <AppTopBar title="" onBack={() => navigate({ to: "/" })} />

      <main className="flex flex-1 flex-col items-center gap-x4 pt-x10">
        <AuthIntroSection
          title="비밀번호 찾기"
          description="본인 인증 후 새 비밀번호로 재설정할 수 있어요."
          titleClassName="typo-t8bold"
        />

        <FindPasswordFormSection onFormChange={setIsFormComplete} forceInvalidId={forceInvalidId} />
      </main>

      <BottomCTA
        text="다음"
        disabled={!isFormComplete}
        onClick={() => navigate({ to: "/reset-password" })}
      />
    </MobileFrame>
  );
}
