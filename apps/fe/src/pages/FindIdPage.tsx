"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { findId } from "@/api/auth";
import { getErrorMessage } from "@/api/types/common";
import { AppTopBar, BottomCTA } from "@/components/common";
import AuthIntroSection from "@/components/domain/auth/AuthIntroSection";
import AuthLinkRow from "@/components/domain/auth/AuthLinkRow";
import FindIdFormSection from "@/components/domain/auth/FindIdFormSection";
import MobileFrame from "@/components/layout/MobileFrame";

export default function FindIdPage() {
  const [name, setName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isNameFilled = name.trim().length > 0;
  const canFindId =
    isNameFilled && isVerified && /^010\d{8}$/.test(phoneDigits) && verificationToken !== null;

  const handleFindIdClick = () => {
    if (!canFindId || !verificationToken) return;
    void (async () => {
      setIsSubmitting(true);
      try {
        const { loginId } = await findId({
          name: name.trim(),
          phone: phoneDigits,
          verificationToken,
        });
        await navigate({
          to: "/find-id-result",
          search: { name: name.trim(), loginId },
        });
      } catch (e) {
        alert(getErrorMessage(e));
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <MobileFrame>
      <AppTopBar title="" />

      <main className="flex flex-1 flex-col items-center gap-x4 pt-x10">
        <AuthIntroSection
          title="아이디 찾기"
          description="아이디를 찾기 위해 본인 인증이 필요해요."
        />

        <FindIdFormSection
          name={name}
          onNameChange={setName}
          onVerificationChange={setIsVerified}
          onPhoneDigitsChange={setPhoneDigits}
          onVerificationTokenChange={setVerificationToken}
        />

        <div className="mt-x4">
          <AuthLinkRow leftText="회원가입" rightText="비밀번호 찾기" />
        </div>
      </main>

      <BottomCTA
        text={isSubmitting ? "확인 중…" : "아이디 찾기"}
        disabled={!canFindId || isSubmitting}
        onClick={handleFindIdClick}
      />
    </MobileFrame>
  );
}
