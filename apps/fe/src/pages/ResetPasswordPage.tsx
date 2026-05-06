import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { resetPw } from "@/api/auth";
import { getErrorMessage } from "@/api/types/common";
import MobileFrame from "@/components/layout/MobileFrame";
import { AppTopBar, BottomCTA } from "@/components/common";
import AuthIntroSection from "@/components/domain/auth/AuthIntroSection";
import ResetPasswordFormSection from "@/components/domain/auth/ResetPasswordFormSection";
import { clearResetPasswordSession, loadResetPasswordSession } from "@/lib/resetPasswordSession";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [displayName, setDisplayName] = useState("회원");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });

  useEffect(() => {
    const loaded = loadResetPasswordSession();
    if (!loaded) {
      void navigate({ to: "/find-password" });
      return;
    }
    setDisplayName(loaded.name.trim() || "회원");
    setVerificationToken(loaded.verificationToken);
    setSessionReady(true);
  }, [navigate]);

  const handlePasswordPairChange = useCallback((password: string, confirmPassword: string) => {
    setPasswords({ password, confirmPassword });
  }, []);

  const handleSubmit = () => {
    if (!verificationToken || !isFormComplete) return;
    void (async () => {
      setIsSubmitting(true);
      try {
        await resetPw({
          newPassword: passwords.password,
          newPasswordConfirm: passwords.confirmPassword,
          verificationToken,
        });
        clearResetPasswordSession();
        await navigate({ to: "/password-reset-success" });
      } catch (e) {
        alert(getErrorMessage(e));
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  if (!sessionReady) {
    return null;
  }

  return (
    <MobileFrame>
      <AppTopBar title="" onBack={() => navigate({ to: "/find-password" })} />

      <main className="flex flex-1 flex-col gap-x4 pt-x10">
        <AuthIntroSection
          title="비밀번호 재설정"
          description={`${displayName}님, 새 비밀번호를 입력해주세요.`}
          titleClassName="typo-t8bold"
        />

        <ResetPasswordFormSection
          onFormChange={setIsFormComplete}
          onPasswordPairChange={handlePasswordPairChange}
        />
      </main>

      <BottomCTA
        text={isSubmitting ? "변경 중…" : "비밀번호 변경하기"}
        disabled={!isFormComplete || isSubmitting}
        enabledBgClassName="bg-gray-800"
        disabledBgClassName="bg-gray-200"
        onClick={handleSubmit}
      />
    </MobileFrame>
  );
}
