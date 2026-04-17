"use client";

import { useState } from "react";
import { ActionField, FieldLabel } from "@/components/common";
import CarrierBottomSheet from "@/components/common/bottom-sheet/CarrierBottomSheet";

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
  const [verificationCode, setVerificationCode] = useState("");
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
    <section className="flex flex-col gap-x1_5">
      <FieldLabel>{label}</FieldLabel>

      <div className="flex flex-col gap-[6px]">
        {/* 통신사 선택 */}
        <button
          type="button"
          onClick={() => setIsCarrierSheetOpen(true)}
          className="h-14 w-full rounded-r3 border border-gray-300 bg-gray-00 px-x4 text-left text-size-4 text-gray-1000 outline-none"
        >
          {selectedCarrier}
        </button>

        {/* 휴대폰 번호 + 인증번호 받기 */}
        <ActionField
          placeholder="01012341234"
          actionText="인증번호 받기"
          value={phoneNumber}
          onChange={(value) => {
            setPhoneNumber(value);
            setShowPhoneError(true);
            setIsCodeRequested(false);
            setIsVerified(false);
            setVerificationCode("");
            onVerificationChange?.(false);
          }}
          onAction={handleCodeRequest}
        />
        {shouldShowPhoneError && (
          <p className="font-pretendard typo-t3regular px-x2 text-red-700">
            올바른 전화번호를 입력해주세요.
          </p>
        )}

        {/* 인증번호 + 인증하기 */}
        <ActionField
          placeholder="인증번호를 입력해주세요"
          actionText="인증하기"
          value={verificationCode}
          onChange={setVerificationCode}
          readOnly={!isCodeRequested}
          inputBgClassName={isVerified ? "bg-gray-400" : "bg-gray-00"}
          disabled={isVerified}
          onAction={handleVerify}
        />
        {isVerified && (
          <p className="font-pretendard typo-t3regular px-x2 text-green-700">인증되었습니다.</p>
        )}
      </div>

      <CarrierBottomSheet
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
