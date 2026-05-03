import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import DepartureDateBottomSheet from "@/components/domain/taxi-reserve/DepartureDateBottomSheet";
import DepartureTimeBottomSheet from "@/components/domain/taxi-reserve/DepartureTimeBottomSheet";
import DeparturePlaceBottomSheet from "@/components/domain/taxi-reserve/DeparturePlaceBottomSheet";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

const FIELD_MAX = "w-full max-w-[362px] shrink-0 md:max-w-full";

function formatKoreanDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${y}년 ${m}월 ${d}일`;
}

function formatKoreanTime(value: string) {
  if (!value) return "";
  const [h, min] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return value;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#555D6D" strokeWidth="1.5" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="#555D6D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="#555D6D" strokeWidth="1.5" />
      <path d="M12 8v4l2.5 2" stroke="#555D6D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PinGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
        stroke="#555D6D"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" fill="#555D6D" />
    </svg>
  );
}

const courseStops = ["성심당 본점", "몽심 대흥점", "땡큐베리머치", "뮤제 베이커리"];

export default function TaxiReservePage() {
  const navigate = useNavigate();
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [departurePlace, setDeparturePlace] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false);
  const [isPlaceSheetOpen, setIsPlaceSheetOpen] = useState(false);

  const isCheckoutEnabled =
    departureDate.length > 0 && departureTime.length > 0 && departurePlace.trim().length > 0;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen flex-col items-start justify-start overflow-hidden bg-[#f3f4f5]",
        RESPONSIVE_FRAME_WIDTH,
      )}
    >
      <div className="relative flex h-[56px] w-full shrink-0 flex-row items-center justify-between overflow-hidden border-b border-[#eeeff1] bg-white px-[20px] py-[10px]">
        <button
          type="button"
          className="flex h-[36px] w-[36px] shrink-0 flex-row items-center justify-center"
          onClick={() => navigate({ to: "/ai-search-result" })}
          aria-label="뒤로가기"
        >
          <img width={24} height={24} src={ArrowLeft} alt="" />
        </button>
        <div className="h-[36px] w-[36px] shrink-0" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal text-[#1a1c20]">
          택시 예약
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start gap-[10px] overflow-y-auto pb-[calc(113px+env(safe-area-inset-bottom,0px))]">
        <div className="flex w-full flex-col items-start justify-start gap-[24px] bg-white px-[20px] py-[24px]">
          <div className="flex h-[27px] w-full flex-col justify-center font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]">
            예약 정보
          </div>

          <div className="flex w-full flex-col items-start justify-start gap-[24px]">
            <div className="flex w-full flex-col gap-[6px]">
              <span className="font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#555d6d]">
                출발일
              </span>
              <button
                type="button"
                className={cn(
                  "relative h-[56px] overflow-hidden rounded-[12px] border border-solid border-[#dcdee3] px-[20px] py-[16px] text-left",
                  FIELD_MAX,
                )}
                onClick={() => setIsDateSheetOpen(true)}
              >
                <div className="flex h-full flex-row items-center justify-start gap-[8px]">
                  <CalendarGlyph />
                  <span
                    className={cn(
                      "flex-1 font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal",
                      departureDate ? "text-[#1a1c20]" : "text-[#d1d3d8]",
                    )}
                  >
                    {departureDate ? formatKoreanDate(departureDate) : "출발일을 선택해주세요"}
                  </span>
                </div>
              </button>
            </div>

            <div className="flex w-full flex-col gap-[6px]">
              <span className="font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#555d6d]">
                출발 시간
              </span>
              <button
                type="button"
                className={cn(
                  "relative h-[56px] overflow-hidden rounded-[12px] border border-solid border-[#dcdee3] px-[20px] py-[16px] text-left",
                  FIELD_MAX,
                )}
                onClick={() => setIsTimeSheetOpen(true)}
              >
                <div className="flex h-full flex-row items-center justify-start gap-[8px]">
                  <ClockGlyph />
                  <span
                    className={cn(
                      "flex-1 font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal",
                      departureTime ? "text-[#1a1c20]" : "text-[#d1d3d8]",
                    )}
                  >
                    {departureTime ? formatKoreanTime(departureTime) : "출발 시간을 선택해주세요"}
                  </span>
                </div>
              </button>
            </div>

            <div className="flex w-full flex-col gap-[6px]">
              <span className="font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#555d6d]">
                탑승 인원
              </span>
              <div
                className={cn(
                  "flex flex-row items-center justify-between overflow-hidden rounded-[12px] border border-solid border-[#dcdee3] px-[20px] py-[12px]",
                  FIELD_MAX,
                )}
              >
                <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal text-[#555d6d]">
                  {passengerCount}명
                </span>
                <div className="flex w-[100px] shrink-0 flex-row items-center justify-start">
                  <button
                    type="button"
                    className="rounded-[4px] bg-[#f7f8f9] p-[4px] disabled:opacity-40"
                    disabled={passengerCount <= 1}
                    onClick={() => setPassengerCount((c) => Math.max(1, c - 1))}
                    aria-label="인원 감소"
                  >
                    <span className="block h-[24px] w-[24px] text-center text-[18px] leading-[24px] text-[#1a1c20]">
                      −
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col justify-center self-stretch text-center font-['Pretendard',sans-serif] text-[18px] leading-[24px] tracking-normal text-[#1a1c20]">
                    {passengerCount}
                  </div>
                  <button
                    type="button"
                    className="rounded-[4px] bg-[#f7f8f9] p-[4px] disabled:opacity-40"
                    disabled={passengerCount >= 8}
                    onClick={() => setPassengerCount((c) => Math.min(8, c + 1))}
                    aria-label="인원 증가"
                  >
                    <span className="block h-[24px] w-[24px] text-center text-[18px] leading-[24px] text-[#1a1c20]">
                      +
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[6px]">
              <span className="font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#555d6d]">
                출발 장소
              </span>
              <button
                type="button"
                className={cn(
                  "flex h-[56px] flex-row items-center justify-start gap-[8px] overflow-hidden rounded-[12px] border border-solid border-[#dcdee3] px-[20px] py-[16px] text-left",
                  FIELD_MAX,
                )}
                onClick={() => setIsPlaceSheetOpen(true)}
              >
                <PinGlyph />
                <span
                  className={cn(
                    "min-w-0 flex-1 font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal",
                    departurePlace.trim() ? "text-[#1a1c20]" : "text-[#d1d3d8]",
                  )}
                >
                  {departurePlace.trim() ? departurePlace : "출발 장소를 선택해주세요"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-start gap-[24px] overflow-hidden border-b border-[#f7f8f9] bg-white px-[20px] py-[24px]">
          <div className="w-full font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]">
            예약 코스
          </div>
          <div className="flex w-full flex-col items-start justify-start gap-[24px]">
            <div className="flex w-full max-w-[362px] flex-1 flex-col items-start justify-start gap-[6px] md:max-w-full">
              <div className="w-full font-['Pretendard',sans-serif] text-[16px] font-bold leading-[22px] tracking-normal text-[#1a1c20]">
                커플을 위한 달콤한 빵투어
              </div>
              <div className="flex w-full flex-row flex-wrap items-center justify-start gap-[8px]">
                <div className="flex flex-row items-center justify-start gap-[4px]">
                  <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#868b94]">
                    소요시간
                  </span>
                  <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#2a3038]">
                    3~4시간
                  </span>
                </div>
                <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#868b94]">
                  ·
                </span>
                <div className="flex flex-row items-center justify-start gap-[4px]">
                  <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#868b94]">
                    예상비용
                  </span>
                  <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#2a3038]">
                    3만원
                  </span>
                </div>
                <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#868b94]">
                  ·
                </span>
                <div className="flex flex-row items-center justify-start gap-[4px]">
                  <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#868b94]">
                    방문 매장 수
                  </span>
                  <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#2a3038]">
                    4곳{" "}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-start justify-start overflow-hidden rounded-[8px] border border-solid border-[#f3f4f5] bg-[#f7f8f9] p-[14px]">
              <div className="relative flex w-full flex-col items-start justify-start gap-[6px] px-0 py-[4px]">
                <div className="absolute bottom-0 left-[7px] top-0 w-[2px] shrink-0 bg-[#eeeff1]" />
                {courseStops.map((name, i) => (
                  <div
                    key={name}
                    className="flex w-full flex-row items-center justify-start gap-[4px]"
                  >
                    <span className="z-[1] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#dcdee3] text-[10px] font-bold text-[#555d6d]">
                      {i + 1}
                    </span>
                    <div className="flex-1 font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                      {name}
                    </div>
                  </div>
                ))}
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
        <div className="flex w-full flex-row items-start justify-start overflow-hidden border-t border-[#eeeff1] bg-white px-[20px] py-[12px]">
          <button
            type="button"
            disabled={!isCheckoutEnabled}
            onClick={() => {
              if (!isCheckoutEnabled) return;
              navigate({
                to: "/taxi-payment",
                search: {
                  departureDate,
                  departureTime,
                  departurePlace,
                  passengers: passengerCount,
                },
              });
            }}
            className={cn(
              "flex h-[56px] flex-1 flex-row items-center justify-center overflow-hidden rounded-[12px] px-[20px] py-[16px] font-['Pretendard',sans-serif] text-[18px] font-bold leading-[24px] tracking-normal transition-colors",
              isCheckoutEnabled
                ? "cursor-pointer bg-gray-800 text-gray-00"
                : "cursor-not-allowed bg-[#f3f4f5] text-[#d1d3d8]",
            )}
          >
            결제하러 가기
          </button>
        </div>
        <div className="relative h-[33px] w-full shrink-0 bg-white">
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-[100px] bg-black" />
        </div>
      </div>

      <DepartureDateBottomSheet
        open={isDateSheetOpen}
        value={departureDate}
        onClose={() => setIsDateSheetOpen(false)}
        onConfirm={setDepartureDate}
      />
      <DepartureTimeBottomSheet
        open={isTimeSheetOpen}
        value={departureTime}
        departureDate={departureDate}
        onClose={() => setIsTimeSheetOpen(false)}
        onConfirm={setDepartureTime}
      />
      <DeparturePlaceBottomSheet
        open={isPlaceSheetOpen}
        value={departurePlace}
        onClose={() => setIsPlaceSheetOpen(false)}
        onConfirm={setDeparturePlace}
      />
    </div>
  );
}
