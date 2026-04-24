import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ActionField, AppTopBar, BottomCTA, TextField } from "@/components/common";
import {
  PhoneVerificationSection,
  SignupSection,
  TermsAgreementSection,
  UserTypeSection,
} from "@/components/domain/auth";
import MobileFrame from "@/components/layout/MobileFrame";
import { cn } from "@/utils/cn";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [isUserIdDupChecked, setIsUserIdDupChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isAllAgreed, setIsAllAgreed] = useState(false);

  const removeKorean = (value: string) => value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");

  const handleUserIdChange = (value: string) => {
    const sanitized = removeKorean(value)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 20);

    setUserId(sanitized);
    setIsUserIdDupChecked(false);
  };

  const handlePasswordChange = (value: string) => {
    const sanitized = removeKorean(value).replace(/\s/g, "").slice(0, 16);

    setPassword(sanitized);
  };

  const isUserIdFilled = userId.length > 0;
  const isPasswordFilled = password.length > 0;
  const isEmailFilled = email.length > 0;

  const isUserIdValid = /^[a-z0-9_-]{5,20}$/.test(userId);
  const hasPasswordMinLength = password.length >= 8;
  const hasPasswordSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasPasswordMinLength && hasPasswordSpecialChar;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isUserIdInvalid = isUserIdFilled && !isUserIdValid;
  const isPasswordInvalid = isPasswordFilled && !isPasswordValid;
  const isEmailInvalid = isEmailFilled && !isEmailValid;

  const userIdHelperText = isUserIdFilled
    ? isUserIdValid
      ? isUserIdDupChecked
        ? "사용할 수 있는 아이디입니다."
        : "아이디 중복확인을 해주세요."
      : "아이디를 5자 이상 입력해주세요."
    : "5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다.";

  const passwordHelperText = isPasswordFilled
    ? isPasswordValid
      ? "사용할 수 있는 비밀번호입니다."
      : !hasPasswordMinLength
        ? "비밀번호를 8자 이상 입력해주세요."
        : "비밀번호에 특수문자를 넣어주세요."
    : "8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요.";

  const emailHelperText = isEmailFilled
    ? isEmailValid
      ? "올바른 이메일입니다."
      : "올바른 이메일을 입력해주세요."
    : undefined;

  const isUserIdSuccess = isUserIdValid && isUserIdDupChecked;
  const isUserIdWarn = isUserIdInvalid || (isUserIdValid && !isUserIdDupChecked);

  const userIdHelperClassName = cn(
    isUserIdSuccess && "text-green-700",
    isUserIdWarn && "text-red-700",
  );

  const userIdContainerClassName = cn(
    isUserIdSuccess && "border-green-700",
    isUserIdWarn && "border-red-700",
  );

  const userIdInputClassName = cn(
    isUserIdSuccess && "text-green-700",
    isUserIdWarn && "text-red-700 placeholder:text-red-700",
  );

  const passwordHelperClassName = cn(
    isPasswordValid && "text-green-700",
    isPasswordInvalid && "text-red-700",
  );

  const passwordInputClassName = cn(
    isPasswordValid && "border-green-700 text-green-700",
    isPasswordInvalid && "border-red-700 text-red-700 placeholder:text-red-700",
  );

  const emailHelperClassName = cn(
    isEmailValid && "text-green-700",
    isEmailInvalid && "text-red-700",
  );

  const emailInputClassName = cn(
    isEmailValid && "border-green-700 text-green-700",
    isEmailInvalid && "border-red-700 text-red-700 placeholder:text-red-700",
  );

  const isNameValid = name.trim().length > 0;
  const canSubmit =
    isNameValid &&
    isUserIdValid &&
    isUserIdDupChecked &&
    isPasswordValid &&
    isEmailValid &&
    isPhoneVerified &&
    isAllAgreed;

  const handleSubmit = () => {
    if (!canSubmit) return;

    navigate({ to: "/signup-result" });

    // Fallback for cases where router transition is delayed or blocked in dev.
    requestAnimationFrame(() => {
      if (window.location.pathname !== "/signup-result") {
        window.location.assign("/signup-result");
      }
    });
  };

  return (
    <MobileFrame>
      <AppTopBar title="회원가입" />

      <main className="flex flex-1 flex-col gap-x8 bg-white px-x5 py-x8">
        <SignupSection label="이름">
          <TextField placeholder="실명을 입력해주세요" value={name} onChange={setName} />
        </SignupSection>

        <SignupSection
          label="아이디"
          helperText={userIdHelperText}
          helperTextClassName={userIdHelperClassName}
        >
          <ActionField
            placeholder="아이디를 입력해주세요"
            actionText="중복 확인"
            value={userId}
            onChange={handleUserIdChange}
            onActionClick={() => {
              if (isUserIdValid) {
                setIsUserIdDupChecked(true);
              }
            }}
            containerClassName={userIdContainerClassName}
            inputClassName={userIdInputClassName}
            actionClassName={cn(isUserIdDupChecked ? "text-gray-500" : "text-gray-800")}
          />
        </SignupSection>

        <SignupSection
          label="비밀번호"
          helperText={passwordHelperText}
          helperTextClassName={passwordHelperClassName}
        >
          <TextField
            placeholder="비밀번호를 입력해주세요"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className={passwordInputClassName}
          />
        </SignupSection>

        <SignupSection
          label="이메일"
          helperText={emailHelperText}
          helperTextClassName={emailHelperClassName}
        >
          <TextField
            placeholder="abc@email.com"
            value={email}
            onChange={setEmail}
            className={emailInputClassName}
          />
        </SignupSection>

        <UserTypeSection />
        <PhoneVerificationSection onVerificationChange={setIsPhoneVerified} />
        <TermsAgreementSection onAllCheckedChange={setIsAllAgreed} />
      </main>

      <BottomCTA text="가입하기" disabled={!canSubmit} onClick={handleSubmit} />
    </MobileFrame>
  );
}
