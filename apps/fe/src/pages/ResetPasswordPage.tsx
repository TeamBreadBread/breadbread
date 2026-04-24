import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import MobileFrame from "@/components/layout/MobileFrame";
import { AppTopBar, BottomCTA } from "@/components/common";
import AuthIntroSection from "@/components/domain/auth/AuthIntroSection";
import ResetPasswordFormSection from "@/components/domain/auth/ResetPasswordFormSection";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isFormComplete, setIsFormComplete] = useState(false);

  return (
    <MobileFrame>
      <AppTopBar title="" onBack={() => navigate({ to: "/find-password" })} />

      <main className="flex flex-1 flex-col gap-x4 pt-x10">
        <AuthIntroSection
          title="비밀번호 재설정"
          description="비밀번호 변경 유의사항"
          titleClassName="typo-t8bold"
        />

        <ResetPasswordFormSection onFormChange={setIsFormComplete} />
      </main>

      <BottomCTA
        text="비밀번호 변경하기"
        disabled={!isFormComplete}
        enabledBgClassName="bg-gray-800"
        disabledBgClassName="bg-gray-200"
        onClick={() => navigate({ to: "/password-reset-success" })}
      />
    </MobileFrame>
  );
}
