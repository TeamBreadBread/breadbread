"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, BottomCTA } from "@/components/common";
import AuthIntroSection from "@/components/domain/auth/AuthIntroSection";
import AuthLinkRow from "@/components/domain/auth/AuthLinkRow";
import FindIdFormSection from "@/components/domain/auth/FindIdFormSection";
import MobileFrame from "@/components/layout/MobileFrame";

export default function FindIdPage() {
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  const handleFindIdClick = () => {
    navigate({ to: "/find-id-result" });
  };

  return (
    <MobileFrame>
      <AppTopBar title="" />

      <main className="flex flex-1 flex-col items-center gap-x4 pt-x10">
        <AuthIntroSection
          title="아이디 찾기"
          description="아이디를 찾기 위해 본인 인증이 필요해요."
        />

        <FindIdFormSection onVerificationChange={setIsVerified} />

        <div className="mt-x4">
          <AuthLinkRow leftText="회원가입" rightText="비밀번호 찾기" />
        </div>
      </main>

      <BottomCTA text="아이디 찾기" disabled={!isVerified} onClick={handleFindIdClick} />
    </MobileFrame>
  );
}
