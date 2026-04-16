"use client";

import { useState } from "react";
import { ActionField, FieldLabel } from "@/components/common";
import BottomSheet from "@/components/common/bottom-sheet/CarrierBottomSheet";

interface PhoneVerificationSectionProps {
  label?: string;
  onVerificationChange?: (isVerified: boolean) => void;
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
  const [isCodeRequested, setIsCodeRequested] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("SKT");
  const [isCarrierSheetOpen, setIsCarrierSheetOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneError, setShowPhoneError] = useState(false);

  const isPhoneNumberValid = /^01[016789]\d{7,8}$/.test(phoneNumber);
  const shouldShowPhoneError = showPhoneError && phoneNumber.length > 0 && !isPhoneNumberValid;

  const handleCodeRequest = () => {
    setShowPhoneError(true);
    onVerificationChange?.(false);
    if (!isPhoneNumberValid) {
      setIsCodeRequested(false);
      setIsVerified(false);
      return;
    }

    setIsVerified(false);
    setIsCodeRequested(true);
  };

  const handleVerify = () => {
    setIsVerified(true);
    onVerificationChange?.(true);
  };

  return (
    <section className="flex flex-col gap-x1-5">
      <FieldLabel className="text-gray-800">{label}</FieldLabel>

      <div className="flex flex-col gap-x1-5">
        <button
          type="button"
          onClick={() => setIsCarrierSheetOpen(true)}
          className="h-14 w-full rounded-r3 border border-gray-300 bg-white px-x4 py-x3 text-left text-size-4 font-normal leading-t5 tracking-[-0.1px] text-gray-1000"
        >
          {selectedCarrier}
        </button>

        <ActionField
          placeholder="01012341234"
          actionText="인증번호 받기"
          variant="outline"
          inputMode="numeric"
          value={phoneNumber}
          onValueChange={(value) => {
            setPhoneNumber(value);
            setShowPhoneError(true);
            setIsCodeRequested(false);
            setIsVerified(false);
            onVerificationChange?.(false);
          }}
          onActionClick={handleCodeRequest}
          tone={shouldShowPhoneError ? "error" : "default"}
          disableHover
        />
        {shouldShowPhoneError ? (
          <p className="t3regular red_700 px-x2">올바른 전화번호를 입력해주세요.</p>
        ) : null}

        <ActionField
          placeholder="인증번호를 입력해주세요"
          actionText="인증하기"
          variant="outline"
          disabled={!isCodeRequested}
          actionButtonClassName={isCodeRequested ? "text-gray-800" : undefined}
          inputMode="numeric"
          inputBgColor={isVerified ? "gray-200" : "gray-00"}
          onActionClick={handleVerify}
          disableHover
          isVerified={isVerified}
        />
        {isVerified ? <p className="t3regular green_700 px-x2">인증되었습니다.</p> : null}
      </div>

      <BottomSheet
        title="통신사를 선택해주세요"
        options={CARRIER_OPTIONS}
        selectedValue={selectedCarrier}
        onSelect={setSelectedCarrier}
        isOpen={isCarrierSheetOpen}
        onClose={() => setIsCarrierSheetOpen(false)}
      />
    </section>
  );
}
