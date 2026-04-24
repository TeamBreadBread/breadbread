import { useEffect, useState } from "react";
import { FieldLabel, TextField } from "@/components/common";
import AuthLinkRow from "./AuthLinkRow";
import PhoneVerificationSection from "./PhoneVerificationSection";

interface FindPasswordFormSectionProps {
  onFormChange?: (isComplete: boolean) => void;
  forceInvalidId?: boolean;
}

export default function FindPasswordFormSection({
  onFormChange,
  forceInvalidId = false,
}: FindPasswordFormSectionProps) {
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const isInvalidIdentifier = forceInvalidId && identifier.trim().length > 0;

  useEffect(() => {
    onFormChange?.(Boolean(identifier.trim() && name.trim() && isPhoneVerified));
  }, [identifier, isPhoneVerified, name, onFormChange]);

  return (
    <section className="w-full px-x5">
      <div className="flex flex-col gap-x5">
        <div className="flex flex-col gap-x1_5">
          <FieldLabel>아이디</FieldLabel>
          <TextField
            placeholder="아이디를 입력해주세요"
            value={identifier}
            onChange={setIdentifier}
            blockKorean
            error={isInvalidIdentifier}
          />
          {isInvalidIdentifier && (
            <p className="font-pretendard typo-t3regular px-x2 text-[color:var(--color-red-700)]">
              존재하지 않는 아이디입니다.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-x1_5">
          <FieldLabel>이름</FieldLabel>
          <TextField placeholder="이름을 입력해주세요" value={name} onChange={setName} />
        </div>

        <PhoneVerificationSection onVerificationChange={setIsPhoneVerified} />

        <div className="pt-x4">
          <AuthLinkRow leftText="회원가입" rightText="아이디 찾기" />
        </div>
      </div>
    </section>
  );
}
