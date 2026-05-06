import { useEffect, useState } from "react";
import { FieldLabel } from "@/components/common";
import PasswordField from "@/components/common/form/PasswordField";

interface ResetPasswordFormSectionProps {
  onFormChange?: (isComplete: boolean) => void;
  onPasswordPairChange?: (password: string, confirmPassword: string) => void;
}

export default function ResetPasswordFormSection({
  onFormChange,
  onPasswordPairChange,
}: ResetPasswordFormSectionProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 비밀번호 조건 검사
  const passwordLengthValid = password.length >= 8 && password.length <= 16;
  const passwordLowerValid = /[a-z]/.test(password);
  const passwordUpperValid = /[A-Z]/.test(password);
  const passwordNumberValid = /[0-9]/.test(password);
  const passwordSpecialValid = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid =
    passwordLengthValid &&
    passwordLowerValid &&
    passwordUpperValid &&
    passwordNumberValid &&
    passwordSpecialValid;

  // 입력 완료 여부
  useEffect(() => {
    onFormChange?.(
      Boolean(
        password.trim() &&
        confirmPassword.trim() &&
        isPasswordValid &&
        password === confirmPassword,
      ),
    );
  }, [confirmPassword, onFormChange, password, isPasswordValid]);

  useEffect(() => {
    onPasswordPairChange?.(password, confirmPassword);
  }, [confirmPassword, onPasswordPairChange, password]);

  // 안내 메시지 및 색상
  let passwordMessage = "";
  let passwordMessageColor = "text-gray-700";
  let passwordInputBorder = "border-gray-400";
  if (password.length > 0) {
    if (!passwordLengthValid) {
      passwordMessage = "비밀번호를 8자 이상 입력해주세요.";
      passwordMessageColor = "text-[color:var(--color-red-700)]";
      passwordInputBorder = "border-[color:var(--color-red-700)]";
    } else if (!passwordSpecialValid) {
      passwordMessage = "비밀번호에 특수문자를 넣어주세요.";
      passwordMessageColor = "text-[color:var(--color-red-700)]";
      passwordInputBorder = "border-[color:var(--color-red-700)]";
    } else if (!isPasswordValid) {
      passwordMessage = "영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.";
      passwordMessageColor = "text-[color:var(--color-red-700)]";
      passwordInputBorder = "border-[color:var(--color-red-700)]";
    } else {
      passwordMessage = "사용할 수 있는 비밀번호입니다.";
      passwordMessageColor = "text-[color:var(--color-green-700)]";
      passwordInputBorder = "border-[color:var(--color-green-700)]";
    }
  }

  return (
    <section className="w-full px-x5">
      <div className="flex flex-col gap-x8">
        <div className="flex flex-col gap-[6px]">
          <FieldLabel>새 비밀번호</FieldLabel>
          <PasswordField
            placeholder="새 비밀번호를 입력해주세요"
            value={password}
            onChange={setPassword}
            borderClassName={passwordInputBorder}
          />
          <p className={`typo-t3regular px-x2 ${passwordMessageColor}`}>
            {password.length === 0
              ? "8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요."
              : passwordMessage}
          </p>
        </div>
        <div className="flex flex-col gap-[6px]">
          <FieldLabel>새 비밀번호 확인</FieldLabel>
          <PasswordField
            placeholder="새 비밀번호를 한 번 더 입력해주세요"
            value={confirmPassword}
            onChange={setConfirmPassword}
            borderClassName={
              password.length > 0 &&
              confirmPassword.length > 0 &&
              password === confirmPassword &&
              isPasswordValid
                ? "border-[color:var(--color-green-700)]"
                : confirmPassword.length > 0 && password !== confirmPassword
                  ? "border-[color:var(--color-red-700)]"
                  : "border-gray-400"
            }
          />
        </div>
      </div>
    </section>
  );
}
