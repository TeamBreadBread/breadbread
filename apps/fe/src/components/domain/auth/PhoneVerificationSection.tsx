"use client";

import { useEffect, useState } from "react";
import { ActionField, FieldLabel } from "@/components/common";
import BottomSheet from "@/components/common/form/BottomSheet";
import { cn } from "@/utils/cn";

interface PhoneVerificationSectionProps {
  onVerificationChange?: (verified: boolean) => void;
}

export default function PhoneVerificationSection({
  onVerificationChange,
}: PhoneVerificationSectionProps) {
  const [selectedCarrier, setSelectedCarrier] = useState("SKT");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeRequested, setIsCodeRequested] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const isPhoneNumberFilled = phoneNumber.length > 0;
  const isPhoneNumberValid = /^\d{10,11}$/.test(phoneNumber);
  const isPhoneNumberInvalid = isPhoneNumberFilled && !isPhoneNumberValid;

  const phoneActionClassName = cn(isPhoneNumberValid && "text-green-700");
  const phoneContainerClassName = cn(
    isPhoneNumberValid && "border-green-700",
    isPhoneNumberInvalid && "border-red-700",
  );
  const phoneInputClassName = cn(
    isPhoneNumberValid && "text-green-700",
    isPhoneNumberInvalid && "text-red-700 placeholder:text-red-700",
  );

  const verifyActionClassName = cn(
    isVerified && "bg-gray-200 text-gray-500",
    !isVerified && isCodeRequested && "text-gray-800",
  );
  const verifyContainerClassName = cn(isVerified && "bg-gray-200 border-gray-500");

  useEffect(() => {
    onVerificationChange?.(isVerified);
  }, [isVerified, onVerificationChange]);

  return (
    <section className="flex flex-col gap-x1_5">
      <FieldLabel>휴대폰 번호</FieldLabel>

      <div className="flex flex-col gap-x1-5">
        <button
          type="button"
          onClick={() => setIsBottomSheetOpen(true)}
          className="flex h-x14 w-full items-center rounded-r3 border border-gray-400 bg-white px-x5 py-x4 text-left font-pretendard typo-t5regular text-gray-1000"
        >
          {selectedCarrier}
        </button>
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={() => setIsBottomSheetOpen(false)}
          onSelect={setSelectedCarrier}
        />
        <ActionField
          placeholder="01012341234"
          actionText="인증번호 받기"
          value={phoneNumber}
          onChange={(value) => {
            setPhoneNumber(value.replace(/\D/g, ""));
            setIsCodeRequested(false);
            setIsVerified(false);
          }}
          onActionClick={() => {
            if (!isPhoneNumberValid) return;

            setIsCodeRequested(true);
            setIsVerified(false);
            setVerificationCode("");
          }}
          actionDisabled={!isPhoneNumberValid}
          actionClassName={phoneActionClassName}
          containerClassName={phoneContainerClassName}
          inputClassName={phoneInputClassName}
        />
        <ActionField
          placeholder="인증번호를 입력해주세요"
          actionText="인증하기"
          value={verificationCode}
          onChange={(value) => setVerificationCode(value.replace(/\D/g, ""))}
          onActionClick={() => {
            if (isCodeRequested && phoneNumber.trim() && verificationCode.trim()) {
              setIsVerified(true);
            }
          }}
          disabled={isVerified}
          actionDisabled={isVerified}
          inputClassName={isVerified ? "text-gray-500 placeholder:text-gray-500" : undefined}
          actionClassName={verifyActionClassName}
          containerClassName={verifyContainerClassName}
          type="text"
        />
        {isPhoneNumberInvalid ? (
          <p className="font-pretendard typo-t3regular text-red-700">
            올바른 전화번호를 입력해주세요.
          </p>
        ) : null}
        {isVerified ? (
          <p className="font-pretendard typo-t3regular text-green-700">인증되었습니다.</p>
        ) : null}
      </div>
    </section>
  );
}
