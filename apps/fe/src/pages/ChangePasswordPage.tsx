import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import { getMyProfile, updateMyPassword } from "@/api/user";
import { AppTopBar, BottomCTA, FieldLabel, PasswordField } from "@/components/common";
import MobileFrame from "@/components/layout/MobileFrame";
import {
  getAccountPasswordValidationMessage,
  isValidAccountPassword,
} from "@/utils/accountValidation";
import { useNavigate } from "@tanstack/react-router";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getMyProfile()
      .then((profile) => {
        if (!active) return;
        if (profile.socialUser) {
          window.alert("소셜 로그인 계정은 비밀번호 변경을 지원하지 않습니다.");
          void navigate({ to: "/account-settings", replace: true });
        }
      })
      .catch(() => {
        /* 계정 설정에서 진입한 일반 회원은 그대로 진행 */
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const passwordMessage = useMemo(
    () => getAccountPasswordValidationMessage(newPassword),
    [newPassword],
  );

  const passwordMessageClassName = !newPassword
    ? "text-gray-700"
    : isValidAccountPassword(newPassword)
      ? "text-[color:var(--color-green-700)]"
      : "text-[color:var(--color-red-700)]";

  const passwordConfirmMatches =
    newPassword.length > 0 && newPasswordConfirm.length > 0 && newPassword === newPasswordConfirm;
  const canSubmit =
    !profileLoading &&
    currentPassword.trim().length > 0 &&
    isValidAccountPassword(newPassword) &&
    passwordConfirmMatches &&
    !isSaving;

  const handleSave = () => {
    if (!canSubmit) return;
    void (async () => {
      try {
        setIsSaving(true);
        await updateMyPassword({
          currentPassword,
          newPassword,
          newPasswordConfirm,
        });
        window.alert("비밀번호를 변경했어요.");
        await navigate({ to: "/account-settings" });
      } catch (error) {
        window.alert(getErrorMessage(error));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <MobileFrame>
      <AppTopBar
        title="비밀번호 변경"
        centered
        showBackButton
        onBackClick={() => navigate({ to: "/account-settings" })}
      />

      <main className="flex flex-1 flex-col gap-x8 bg-[#f3f4f5] px-x5 py-x8 pb-[120px]">
        <section className="flex flex-col gap-[6px] rounded-r4 bg-white p-x5">
          <FieldLabel>현재 비밀번호</FieldLabel>
          <PasswordField
            placeholder="현재 비밀번호를 입력해주세요"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
        </section>

        <section className="flex flex-col gap-x6 rounded-r4 bg-white p-x5">
          <div className="flex flex-col gap-[6px]">
            <FieldLabel>새 비밀번호</FieldLabel>
            <PasswordField
              placeholder="새 비밀번호를 입력해주세요"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              borderClassName={
                !newPassword
                  ? "border-gray-400"
                  : isValidAccountPassword(newPassword)
                    ? "border-[color:var(--color-green-700)]"
                    : "border-[color:var(--color-red-700)]"
              }
            />
            <p className={`px-x2 typo-t3regular ${passwordMessageClassName}`}>{passwordMessage}</p>
          </div>

          <div className="flex flex-col gap-[6px]">
            <FieldLabel>새 비밀번호 확인</FieldLabel>
            <PasswordField
              placeholder="새 비밀번호를 한 번 더 입력해주세요"
              value={newPasswordConfirm}
              onChange={setNewPasswordConfirm}
              autoComplete="new-password"
              borderClassName={
                !newPasswordConfirm
                  ? "border-gray-400"
                  : passwordConfirmMatches
                    ? "border-[color:var(--color-green-700)]"
                    : "border-[color:var(--color-red-700)]"
              }
            />
            {newPasswordConfirm ? (
              <p
                className={`px-x2 typo-t3regular ${
                  passwordConfirmMatches
                    ? "text-[color:var(--color-green-700)]"
                    : "text-[color:var(--color-red-700)]"
                }`}
              >
                {passwordConfirmMatches
                  ? "새 비밀번호가 일치합니다."
                  : "새 비밀번호가 일치하지 않습니다."}
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <BottomCTA
        text={isSaving ? "변경 중…" : "비밀번호 변경하기"}
        disabled={!canSubmit}
        onClick={handleSave}
      />
    </MobileFrame>
  );
}
