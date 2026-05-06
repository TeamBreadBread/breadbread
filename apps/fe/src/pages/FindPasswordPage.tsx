import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { findPw } from "@/api/auth";
import { getErrorMessage } from "@/api/types/common";
import MobileFrame from "@/components/layout/MobileFrame";
import { AppTopBar, BottomCTA } from "@/components/common";
import AuthIntroSection from "@/components/domain/auth/AuthIntroSection";
import FindPasswordFormSection from "@/components/domain/auth/FindPasswordFormSection";
import { saveResetPasswordSession } from "@/lib/resetPasswordSession";

export default function FindPasswordPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const forceInvalidId =
    new URLSearchParams(window.location.search).get("forceInvalidId") === "true";

  const canProceed =
    isFormComplete &&
    verificationToken !== null &&
    /^010\d{8}$/.test(phoneDigits) &&
    identifier.trim().length > 0 &&
    name.trim().length > 0;

  const handleNext = () => {
    void submitFindPassword();
  };

  async function submitFindPassword() {
    if (!canProceed || !verificationToken) return;
    setIsSubmitting(true);
    try {
      await findPw({
        loginId: identifier.trim(),
        name: name.trim(),
        phone: phoneDigits,
        verificationToken,
      });
      saveResetPasswordSession({
        name: name.trim(),
        verificationToken,
      });
      await navigate({ to: "/reset-password" });
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileFrame>
      <AppTopBar title="" onBack={() => navigate({ to: "/" })} />

      <main className="flex flex-1 flex-col items-center gap-x4 pt-x10">
        <AuthIntroSection
          title="비밀번호 찾기"
          description="본인 인증 후 새 비밀번호로 재설정할 수 있어요."
          titleClassName="typo-t8bold"
        />

        <FindPasswordFormSection
          identifier={identifier}
          onIdentifierChange={setIdentifier}
          name={name}
          onNameChange={setName}
          onFormChange={setIsFormComplete}
          onVerificationTokenChange={setVerificationToken}
          onPhoneDigitsChange={setPhoneDigits}
          forceInvalidId={forceInvalidId}
        />
      </main>

      <BottomCTA
        text={isSubmitting ? "확인 중…" : "다음"}
        disabled={!canProceed || isSubmitting}
        onClick={handleNext}
      />
    </MobileFrame>
  );
}
