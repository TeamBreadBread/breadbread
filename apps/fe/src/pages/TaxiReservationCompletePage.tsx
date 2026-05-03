import { useNavigate } from "@tanstack/react-router";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

export interface TaxiReservationCompletePageProps {
  departureDate: string;
  departureTime: string;
  departurePlace: string;
  passengers: number;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatKoreanTime(value: string) {
  if (!value) return "";
  const [h, min] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return value;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  const w = WEEKDAY_KO[dt.getDay()] ?? "";
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}(${w})`;
}

function SuccessIllustration() {
  return <div className="h-[100px] w-[100px] shrink-0 bg-[#eeeff1]" aria-hidden />;
}

export default function TaxiReservationCompletePage({
  departureDate,
  departureTime,
  departurePlace,
  passengers,
}: TaxiReservationCompletePageProps) {
  const navigate = useNavigate();

  const displayDate = formatDisplayDate(departureDate) || formatDisplayDate("2026-04-29");
  const displayTime = formatKoreanTime(departureTime) || "15:00";
  const displayPlace = departurePlace.trim() || "대전광역시 서구 장군봉 4길 32";
  const displayPassengers = `${passengers}명`;

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-screen flex-col items-start justify-start overflow-hidden bg-[#f3f4f5]",
        RESPONSIVE_FRAME_WIDTH,
      )}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start gap-[10px] overflow-y-auto pb-[calc(113px+env(safe-area-inset-bottom,0px))]">
        <div className="flex w-full flex-col items-center justify-start gap-[28px] bg-white px-[20px] py-[64px]">
          <SuccessIllustration />
          <div className="flex w-full flex-col items-center justify-start gap-[8px]">
            <h1 className="w-full text-center font-['Pretendard',sans-serif] text-[22px] font-bold leading-[30px] tracking-normal text-[#1a1c20]">
              예약이 완료되었습니다 🎉
            </h1>
            <p className="w-full text-center font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal text-[#868b94]">
              달콤한 빵 여행이 기다리고 있어요!
            </p>
          </div>
        </div>

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
      </div>

      <div
        className={cn(
          "fixed bottom-0 left-1/2 z-40 flex -translate-x-1/2 flex-col items-start justify-start bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
          RESPONSIVE_FRAME_WIDTH,
        )}
      >
        <div className="flex w-full flex-row items-start justify-start gap-[10px] overflow-hidden border-t border-[#eeeff1] bg-white px-[20px] py-[12px]">
          <button
            type="button"
            onClick={() => navigate({ to: "/my" })}
            className="flex h-[56px] flex-1 flex-row items-center justify-center overflow-hidden rounded-[12px] bg-[#eeeff1] px-[20px] py-[16px] font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-[#1a1c20]"
          >
            예약 내역
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            className="flex h-[56px] flex-1 flex-row items-center justify-center overflow-hidden rounded-[12px] bg-[#555d6d] px-[20px] py-[16px] font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-white"
          >
            홈으로 돌아가기
          </button>
        </div>
        <div className="relative h-[33px] w-full shrink-0 bg-white">
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-[100px] bg-black" />
        </div>
      </div>
    </div>
  );
}
