import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

export interface TaxiPaymentPageProps {
  departureDate: string;
  departureTime: string;
  departurePlace: string;
  passengers: number;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

const PAYMENT_METHODS = [
  "네이버페이",
  "카카오페이",
  "토스페이",
  "신용/체크 카드",
  "무통장 입금",
  "휴대폰 결제",
] as const;

function formatKoreanTime(value: string) {
  if (!value) return "";
  const [h, min] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return value;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatPaymentDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  const w = WEEKDAY_KO[dt.getDay()] ?? "";
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}(${w})`;
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M1.5 5.2 3.8 7.5 8.5 2.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TaxiPaymentPage({
  departureDate,
  departureTime,
  departurePlace,
  passengers,
}: TaxiPaymentPageProps) {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<(typeof PAYMENT_METHODS)[number] | null>(
    null,
  );
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);

  const allTermsAgreed = agreeTerms && agreePrivacy && agreeRefund;
  const isPayEnabled = selectedMethod !== null && allTermsAgreed;

  const displayDate = formatPaymentDate(departureDate) || formatPaymentDate("2026-04-29");
  const displayTime = formatKoreanTime(departureTime) || "15:00";
  const displayPlace = departurePlace.trim() || "대전광역시 서구 장군봉 4길 32";
  const displayPassengers = `${passengers}명`;

  const toggleAllTerms = () => {
    const next = !allTermsAgreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeRefund(next);
  };

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-screen flex-col items-start justify-start overflow-hidden bg-[#f3f4f5]",
        RESPONSIVE_FRAME_WIDTH,
      )}
    >
      <div className="relative flex h-[56px] w-full shrink-0 flex-row items-center justify-between overflow-hidden border-b border-[#eeeff1] bg-white px-[20px] py-[10px]">
        <button
          type="button"
          className="flex h-[36px] w-[36px] shrink-0 flex-row items-center justify-center"
          onClick={() => navigate({ to: "/taxi-reserve" })}
          aria-label="뒤로가기"
        >
          <img width={24} height={24} src={ArrowLeft} alt="" />
        </button>
        <div className="h-[36px] w-[36px] shrink-0" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-[#1a1c20]">
          결제하기
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start gap-[10px] overflow-y-auto pb-[calc(113px+env(safe-area-inset-bottom,0px))]">
        <div className="flex w-full flex-col items-start justify-start gap-[24px] overflow-hidden border-b border-[#f7f8f9] bg-white px-[20px] py-[24px]">
          <div className="w-full font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]">
            예약 정보
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-[20px]">
            <div className="flex w-full flex-col items-start justify-start gap-[16px] overflow-hidden rounded-[8px]">
              <div className="flex w-full flex-row items-start justify-between gap-3">
                <div className="shrink-0 whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                  코스명
                </div>
                <div className="min-w-0 text-right font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#1a1c20]">
                  커플을 위한 달콤한 빵투어
                </div>
              </div>
              <div className="flex w-full flex-row items-start justify-between">
                <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                  출발일
                </div>
                <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#1a1c20]">
                  {displayDate}
                </div>
              </div>
              <div className="flex w-full flex-row items-start justify-between">
                <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                  출발 시간
                </div>
                <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#1a1c20]">
                  {displayTime}
                </div>
              </div>
              <div className="flex w-full flex-row items-start justify-between">
                <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                  탑승 인원
                </div>
                <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#1a1c20]">
                  {displayPassengers}
                </div>
              </div>
              <div className="flex w-full flex-row items-start justify-between gap-3">
                <div className="shrink-0 whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                  출발 장소
                </div>
                <div className="min-w-0 text-right font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#1a1c20]">
                  {displayPlace}
                </div>
              </div>
            </div>
            <div className="h-px w-full shrink-0 bg-[#eeeff1]" />
            <div className="flex w-full flex-row items-start justify-between">
              <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[18px] font-medium leading-[24px] tracking-normal text-[#1a1c20]">
                총 결제 금액
              </div>
              <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-[#1a1c20]">
                30,000원
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-start justify-start gap-[24px] bg-white px-[20px] py-[24px]">
          <div className="flex h-[27px] w-full flex-col justify-center font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]">
            결제 수단
          </div>
          <div className="grid w-full grid-cols-2 gap-[9px]">
            {PAYMENT_METHODS.map((label) => {
              const selected = selectedMethod === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedMethod(label)}
                  className={cn(
                    "flex min-h-[64px] w-full flex-col items-center justify-center rounded-[8px] border border-solid px-[20px] pt-[10px] pb-[12px] text-center transition-colors",
                    selected ? "border-[#b0b3ba] bg-[#eeeff1]" : "border-[#f3f4f5] bg-[#f7f8f9]",
                  )}
                >
                  <span className="w-full font-['Pretendard',sans-serif] text-[16px] font-medium leading-[22px] tracking-normal text-[#2a3038]">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-full flex-col items-start justify-start gap-[16px] bg-white px-[20px] py-[24px]">
          <div className="flex w-full flex-row items-center justify-start gap-[8px]">
            <button
              type="button"
              onClick={toggleAllTerms}
              className={cn(
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-solid",
                allTermsAgreed ? "border-gray-800 bg-gray-800" : "border-[#dcdee3] bg-white",
              )}
              aria-pressed={allTermsAgreed}
            >
              {allTermsAgreed ? <CheckGlyph /> : null}
            </button>
            <button
              type="button"
              className="flex-1 text-left font-['Pretendard',sans-serif] text-[16px] font-medium leading-[22px] tracking-normal text-[#555d6d]"
              onClick={toggleAllTerms}
            >
              전체 동의
            </button>
          </div>

          {(
            [
              { checked: agreeTerms, set: setAgreeTerms, label: "[필수] 빵빵 이용약관 동의" },
              {
                checked: agreePrivacy,
                set: setAgreePrivacy,
                label: "[필수] 빵빵 개인정보 수집 및 이용 동의",
              },
              { checked: agreeRefund, set: setAgreeRefund, label: "[필수] 빵빵 환불정책 동의" },
            ] as const
          ).map(({ checked, set, label }) => (
            <div key={label} className="flex w-full flex-row items-center justify-start gap-[8px]">
              <button
                type="button"
                onClick={() => set(!checked)}
                className={cn(
                  "relative flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-solid",
                  checked ? "border-gray-800 bg-gray-800" : "border-[#dcdee3] bg-white",
                )}
                aria-pressed={checked}
              >
                {checked ? <CheckGlyph className="relative z-[1]" /> : null}
              </button>
              <button
                type="button"
                className="min-w-0 flex-1 text-left font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal text-[#868b94]"
                onClick={() => set(!checked)}
              >
                {label}
              </button>
              <span
                className="flex h-[22px] w-[22px] shrink-0 items-center justify-center"
                aria-hidden
              >
                <span className="h-[16px] w-[16px] rounded-full bg-[#dcdee3]" />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-1/2 z-40 flex -translate-x-1/2 flex-col items-start justify-start bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
          RESPONSIVE_FRAME_WIDTH,
        )}
      >
        <div className="flex w-full flex-row items-start justify-start overflow-hidden border-t border-[#eeeff1] bg-white px-[20px] py-[12px]">
          <button
            type="button"
            disabled={!isPayEnabled}
            onClick={() => {
              if (!isPayEnabled) return;
              navigate({
                to: "/taxi-reservation-complete",
                search: {
                  departureDate,
                  departureTime,
                  departurePlace,
                  passengers,
                },
              });
            }}
            className={cn(
              "flex h-[56px] flex-1 flex-row items-center justify-center gap-[8px] overflow-hidden rounded-[12px] px-[20px] py-[16px] font-['Pretendard',sans-serif] text-[18px] leading-[24px] tracking-normal transition-colors",
              isPayEnabled
                ? "cursor-pointer bg-gray-800 text-gray-00"
                : "cursor-not-allowed bg-[#f3f4f5] text-[#d1d3d8]",
            )}
          >
            <span className="font-bold">30,000원</span>
            <span className="font-medium">결제하기</span>
          </button>
        </div>
        <div className="relative h-[33px] w-full shrink-0 bg-white">
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-[100px] bg-black" />
        </div>
      </div>
    </div>
  );
}
