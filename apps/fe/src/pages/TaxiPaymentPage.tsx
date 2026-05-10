import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import PortOne from "@portone/browser-sdk/v2";
import { getCourseDetail, type CourseDetail } from "@/api/courses";
import { completePayment, preparePayment, type PreparePaymentMethodDetail } from "@/api/payments";
import { createReservation, getReservationById, type ReservationDetail } from "@/api/reservation";
import { getErrorMessage } from "@/api/types/common";
import { PortOneCredentialsModal } from "@/components/payment/PortOneCredentialsModal";
import { buildTaxiPortOnePaymentRequest } from "@/lib/buildPortonePaymentRequest";
import { resolvePortOneBrowserKeys } from "@/lib/portoneSettings";
import { writeTaxiReturnPayload } from "@/lib/portoneTaxiReturn";
import { AI_COURSE_RESULT_STORAGE_KEY } from "@/utils/aiCourseStorage";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

export interface TaxiPaymentPageProps {
  departureDate: string;
  departureTime: string;
  departurePlace: string;
  passengers: number;
  courseId: number;
  lat: number;
  lng: number;
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

const PAYMENT_PREPARE_MAP: Record<
  (typeof PAYMENT_METHODS)[number],
  { method: "CARD" | "EASY_PAY" | "VIRTUAL_ACCOUNT" | "MOBILE"; detail: PreparePaymentMethodDetail }
> = {
  네이버페이: { method: "EASY_PAY", detail: "NAVER_PAY" },
  카카오페이: { method: "EASY_PAY", detail: "KAKAO_PAY" },
  토스페이: { method: "EASY_PAY", detail: "TOSS_PAY" },
  "신용/체크 카드": { method: "CARD", detail: "CARD" },
  "무통장 입금": { method: "VIRTUAL_ACCOUNT", detail: "BANK_TRANSFER" },
  "휴대폰 결제": { method: "MOBILE", detail: "MOBILE" },
};

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

function readSessionCourseDetail(courseId: number): CourseDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AI_COURSE_RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CourseDetail;
    if (!parsed || typeof parsed.id !== "number" || parsed.id !== courseId) return null;
    return parsed;
  } catch {
    return null;
  }
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
  courseId,
  lat,
  lng,
}: TaxiPaymentPageProps) {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<(typeof PAYMENT_METHODS)[number] | null>(
    null,
  );
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reservationDetail, setReservationDetail] = useState<ReservationDetail | null>(null);
  const [courseFromApi, setCourseFromApi] = useState<CourseDetail | null>(null);
  const [portoneModalOpen, setPortoneModalOpen] = useState(false);

  useEffect(() => {
    if (courseId <= 0) return;
    let cancelled = false;
    void getCourseDetail(courseId)
      .then((detail) => {
        if (!cancelled) setCourseFromApi(detail);
      })
      .catch(() => {
        /* 세션/예약 금액으로 표시 */
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const sessionCourse = useMemo(() => readSessionCourseDetail(courseId), [courseId]);
  const coursePreview = courseFromApi ?? sessionCourse;

  const allTermsAgreed = agreeTerms && agreePrivacy && agreeRefund;
  const isPayEnabled = selectedMethod !== null && allTermsAgreed && !isSubmitting;

  const displayDate = formatPaymentDate(departureDate) || formatPaymentDate("2026-04-29");
  const displayTime = formatKoreanTime(departureTime) || "15:00";
  const displayPlace = departurePlace.trim() || "대전광역시 서구 장군봉 4길 32";
  const displayPassengers = `${passengers}명`;
  const displayCourseName =
    reservationDetail?.course.name ?? coursePreview?.name ?? "빵빵 택시 예약 코스";

  const quotedAmount =
    reservationDetail != null
      ? reservationDetail.quotedAmount
      : coursePreview != null &&
          Number.isFinite(coursePreview.estimatedCost) &&
          coursePreview.estimatedCost > 0
        ? coursePreview.estimatedCost
        : 30_000;
  const displayAmountLabel = `${quotedAmount.toLocaleString("ko-KR")}원`;

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
          onClick={() => navigate({ to: "/taxi-reserve", search: { courseId } })}
          aria-label="뒤로가기"
        >
          <img width={24} height={24} src={ArrowLeft} alt="" />
        </button>
        <div className="h-[36px] w-[36px] shrink-0" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-[#1a1c20]">
          결제하기
        </div>
        <button
          type="button"
          className="absolute right-[16px] top-1/2 max-w-[100px] -translate-y-1/2 truncate text-left text-[12px] font-medium text-[#868b94] underline-offset-2 hover:underline"
          onClick={() => setPortoneModalOpen(true)}
        >
          포트원 설정
        </button>
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
                  {displayCourseName}
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
                {displayAmountLabel}
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
          {submitError ? (
            <p className="font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#d32f2f]">
              {submitError}
            </p>
          ) : null}
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
              void (async () => {
                try {
                  setSubmitError("");
                  if (courseId <= 0) {
                    setSubmitError(
                      "예약할 코스 정보가 없습니다. 코스 화면에서 다시 시도해 주세요.",
                    );
                    return;
                  }
                  if (!selectedMethod) {
                    return;
                  }
                  setIsSubmitting(true);

                  const reservationId = await createReservation({
                    courseId,
                    departureDate,
                    departureTime,
                    headCount: passengers,
                    departure: departurePlace,
                    lat,
                    lng,
                  });

                  const detail = await getReservationById(reservationId);
                  setReservationDetail(detail);

                  writeTaxiReturnPayload({
                    departureDate,
                    departureTime,
                    departurePlace,
                    passengers,
                    courseId,
                    paidAmount: detail.quotedAmount,
                    courseName: detail.course.name?.trim() ?? "",
                  });

                  const prepMap = PAYMENT_PREPARE_MAP[selectedMethod];
                  const prep = await preparePayment({
                    reservationId,
                    paymentMethod: prepMap.method,
                    paymentMethodDetail: prepMap.detail,
                  });

                  const keys = resolvePortOneBrowserKeys({
                    storeId: prep.storeId,
                    channelKey: prep.channelKey,
                  });
                  if (!keys.storeId || !keys.channelKey) {
                    setSubmitError(
                      "포트원 Store ID와 채널 키가 필요합니다. 우측 상단 「포트원 설정」에서 입력하거나, 서버·프론트 환경 변수를 설정해 주세요.",
                    );
                    setPortoneModalOpen(true);
                    return;
                  }

                  const redirectUrl = `${window.location.origin}/payment/portone-redirect`;
                  const payReq = buildTaxiPortOnePaymentRequest({
                    storeId: keys.storeId,
                    channelKey: keys.channelKey,
                    paymentId: prep.paymentId,
                    orderName: prep.orderName,
                    totalAmount: Number(prep.amount),
                    paymentMethod: prep.paymentMethod,
                    paymentMethodDetail: prepMap.detail,
                    customerName: prep.customerName,
                    customerPhone: prep.customerPhone,
                    redirectUrl,
                  });

                  const sdkRes = await PortOne.requestPayment(payReq);
                  if (sdkRes === undefined) {
                    return;
                  }
                  if (sdkRes.code != null && sdkRes.code !== "") {
                    setSubmitError(sdkRes.message ?? sdkRes.code);
                    return;
                  }

                  await completePayment({ paymentId: sdkRes.paymentId });
                  navigate({
                    to: "/taxi-reservation-complete",
                    search: {
                      departureDate,
                      departureTime,
                      departurePlace,
                      passengers,
                      courseId,
                      paidAmount: detail.quotedAmount,
                      courseName: detail.course.name?.trim() ?? "",
                    },
                  });
                } catch (error) {
                  setSubmitError(getErrorMessage(error));
                } finally {
                  setIsSubmitting(false);
                }
              })();
            }}
            className={cn(
              "flex h-[56px] flex-1 flex-row items-center justify-center gap-[8px] overflow-hidden rounded-[12px] px-[20px] py-[16px] font-['Pretendard',sans-serif] text-[18px] leading-[24px] tracking-normal transition-colors",
              isPayEnabled
                ? "cursor-pointer bg-gray-800 text-gray-00"
                : "cursor-not-allowed bg-[#f3f4f5] text-[#d1d3d8]",
            )}
          >
            <span className="font-bold">{displayAmountLabel}</span>
            <span className="font-medium">{isSubmitting ? "처리 중..." : "결제하기"}</span>
          </button>
        </div>
        <div className="relative h-[33px] w-full shrink-0 bg-white">
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-[100px] bg-black" />
        </div>
      </div>

      <PortOneCredentialsModal open={portoneModalOpen} onClose={() => setPortoneModalOpen(false)} />
    </div>
  );
}
