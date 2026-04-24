"use client";

import { useEffect, useState } from "react";
import { ActionField, FieldLabel } from "@/components/common";
import BottomSheet from "@/components/common/bottom-sheet/CarrierBottomSheet";
import { cn } from "@/utils/cn";

interface PhoneVerificationSectionProps {
  label?: string;
  onVerificationChange?: (verified: boolean) => void;
}

const CARRIER_OPTIONS = [
  { label: "SKT", value: "SKT" },
  { label: "KT", value: "KT" },
  { label: "LG U+", value: "LG U+" },
  { label: "SKT 알뜰폰", value: "SKT 알뜰폰" },
  { label: "KT 알뜰폰", value: "KT 알뜰폰" },
  { label: "LG U+ 알뜰폰", value: "LG U+ 알뜰폰" },
];

export default function PhoneVerificationSection({
  label = "휴대폰 번호",
  onVerificationChange,
}: PhoneVerificationSectionProps) {
  const [selectedCarrier, setSelectedCarrier] = useState("SKT");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeRequested, setIsCodeRequested] = useState(false);
  const [isCarrierSheetOpen, setIsCarrierSheetOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const digits = phoneNumber.replace(/\D/g, "");
  const isPhoneNumberValid = /^01[016789]\d{7,8}$/.test(digits);
  const isPhoneNumberFilled = digits.length > 0;
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
  const verifyContainerClassName = cn(isVerified && "border-gray-500 bg-gray-200");

  useEffect(() => {
    onVerificationChange?.(isVerified);
  }, [isVerified, onVerificationChange]);

  return (
    <section className="flex flex-col gap-x1-5">
      <FieldLabel className="text-gray-800">{label}</FieldLabel>

      <div className="flex flex-col gap-x1-5">
        <button
          type="button"
          onClick={() => setIsCarrierSheetOpen(true)}
          className="h-14 w-full rounded-r3 border border-gray-300 bg-gray-00 px-x4 py-x3 text-left text-size-4 font-normal leading-t5 tracking-1 text-gray-1000"
        >
          {selectedCarrier}
        </button>
        <BottomSheet
          title="통신사를 선택해주세요"
          options={CARRIER_OPTIONS}
          selectedValue={selectedCarrier}
          onSelect={setSelectedCarrier}
          isOpen={isCarrierSheetOpen}
          onClose={() => setIsCarrierSheetOpen(false)}
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
        {isPhoneNumberInvalid ? (
          <p className="t3regular red_700 px-x2">올바른 전화번호를 입력해주세요.</p>
        ) : null}

        <ActionField
          placeholder="인증번호를 입력해주세요"
          actionText="인증하기"
          value={verificationCode}
          onChange={(value) => setVerificationCode(value.replace(/\D/g, ""))}
          onActionClick={() => {
            if (isCodeRequested && digits && verificationCode.trim()) {
              setIsVerified(true);
            }
          }}
          disabled={isVerified}
          actionDisabled={isVerified}
          type="text"
          inputClassName={isVerified ? "text-gray-500 placeholder:text-gray-500" : undefined}
          actionClassName={verifyActionClassName}
          containerClassName={verifyContainerClassName}
        />
        {isVerified ? <p className="t3regular green_700 px-x2">인증되었습니다.</p> : null}
      </div>
    </section>
  );
}
