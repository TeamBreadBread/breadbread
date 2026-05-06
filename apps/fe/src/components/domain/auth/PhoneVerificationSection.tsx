"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActionField, FieldLabel } from "@/components/common";
import BottomSheet from "@/components/common/bottom-sheet/CarrierBottomSheet";
import { sendPhone, verifyPhone, type VerificationPurpose } from "@/api/auth";
import { getErrorMessage } from "@/api/types/common";
import { cn } from "@/utils/cn";

interface PhoneVerificationSectionProps {
  label?: string;
  /** 백엔드 `VerificationPurpose` 와 동일 */
  purpose: VerificationPurpose;
  onVerificationChange?: (verified: boolean) => void;
  /** 회원가입·찾기 등에서 API 제출용 `verificationToken` */
  onVerificationTokenChange?: (token: string | null) => void;
  /** 숫자만 11자리(010…) — 부모에서 회원가입 `phone` 필드로 전달 */
  onPhoneDigitsChange?: (digits: string) => void;
}

const CARRIER_OPTIONS = [
  { label: "SKT", value: "SKT" },
  { label: "KT", value: "KT" },
  { label: "LG U+", value: "LG U+" },
  { label: "SKT 알뜰폰", value: "SKT 알뜰폰" },
  { label: "KT 알뜰폰", value: "KT 알뜰폰" },
  { label: "LG U+ 알뜰폰", value: "LG U+ 알뜰폰" },
];

/** 백엔드 `SendPhoneRequest.phone` 과 동일: `010` + 8자리 숫자 */
const isBackendPhoneFormat = (digits: string) => /^010\d{8}$/.test(digits);

export default function PhoneVerificationSection({
  label = "휴대폰 번호",
  purpose,
  onVerificationChange,
  onVerificationTokenChange,
  onPhoneDigitsChange,
}: PhoneVerificationSectionProps) {
  const [selectedCarrier, setSelectedCarrier] = useState("SKT");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeRequested, setIsCodeRequested] = useState(false);
  const [isCarrierSheetOpen, setIsCarrierSheetOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const verifyingInFlightRef = useRef(false);

  const digits = phoneNumber.replace(/\D/g, "");
  const isPhoneNumberValid = isBackendPhoneFormat(digits);
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

  const resetVerification = () => {
    setIsVerified(false);
    setIsCodeRequested(false);
    setVerificationCode("");
    setSectionError("");
    onVerificationTokenChange?.(null);
    onVerificationChange?.(false);
  };

  useEffect(() => {
    onVerificationChange?.(isVerified);
  }, [isVerified, onVerificationChange]);

  const submitVerification = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!isCodeRequested || !digits || trimmed.length !== 6 || isVerified) return;
      if (verifyingInFlightRef.current) return;
      verifyingInFlightRef.current = true;
      setIsVerifying(true);
      setSectionError("");
      try {
        const { verificationToken } = await verifyPhone({
          phone: digits,
          code: trimmed,
          purpose,
        });
        setIsVerified(true);
        setSectionError("");
        onVerificationTokenChange?.(verificationToken);
      } catch (error) {
        setSectionError(getErrorMessage(error));
      } finally {
        verifyingInFlightRef.current = false;
        setIsVerifying(false);
      }
    },
    [digits, isCodeRequested, isVerified, onVerificationTokenChange, purpose],
  );

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
          actionText={isSending ? "발송 중…" : "인증번호 받기"}
          value={phoneNumber}
          onChange={(value) => {
            const d = value.replace(/\D/g, "");
            setPhoneNumber(d);
            onPhoneDigitsChange?.(d);
            resetVerification();
          }}
          onActionClick={() => {
            void (async () => {
              if (!isPhoneNumberValid || isSending) return;
              setSectionError("");
              try {
                setIsSending(true);
                await sendPhone({
                  phone: digits,
                  authType: "SMS",
                  purpose,
                });
                setIsCodeRequested(true);
                setIsVerified(false);
                setVerificationCode("");
              } catch (error) {
                setIsCodeRequested(false);
                setSectionError(getErrorMessage(error));
              } finally {
                setIsSending(false);
              }
            })();
          }}
          actionDisabled={!isPhoneNumberValid || isSending}
          actionClassName={phoneActionClassName}
          containerClassName={phoneContainerClassName}
          inputClassName={phoneInputClassName}
        />
        {isPhoneNumberInvalid ? (
          <p className="t3regular red_700 px-x2">
            전화번호는 010으로 시작하는 11자리 번호만 입력할 수 있습니다.
          </p>
        ) : null}
        {!!sectionError && !isVerified ? (
          <p className="t3regular red_700 px-x2">{sectionError}</p>
        ) : null}

        <ActionField
          placeholder="인증번호를 입력해주세요"
          actionText={isVerifying ? "확인 중…" : "인증하기"}
          value={verificationCode}
          onChange={(value) => {
            const next = value.replace(/\D/g, "").slice(0, 6);
            setVerificationCode(next);
            setSectionError("");
            if (next.length === 6) {
              void submitVerification(next);
            }
          }}
          onActionClick={() => {
            void submitVerification(verificationCode);
          }}
          disabled={isVerified}
          actionDisabled={
            isVerified || !isCodeRequested || verificationCode.trim().length !== 6 || isVerifying
          }
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          inputClassName={isVerified ? "text-gray-500 placeholder:text-gray-500" : undefined}
          actionClassName={verifyActionClassName}
          containerClassName={verifyContainerClassName}
        />
        {isVerified ? <p className="t3regular green_700 px-x2">인증되었습니다.</p> : null}
      </div>
    </section>
  );
}
