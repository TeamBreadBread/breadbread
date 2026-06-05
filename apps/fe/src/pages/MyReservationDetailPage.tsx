import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  cancelReservation,
  getReservationById,
  getUnavailableTimes,
  updateReservation,
  type ReservationDetail,
} from "@/api/reservation";
import { getErrorMessage } from "@/api/types/common";
import { AppTopBar } from "@/components/common";
import DepartureDateBottomSheet from "@/components/domain/taxi-reserve/DepartureDateBottomSheet";
import DeparturePlaceBottomSheet from "@/components/domain/taxi-reserve/DeparturePlaceBottomSheet";
import DepartureTimeBottomSheet from "@/components/domain/taxi-reserve/DepartureTimeBottomSheet";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import {
  formatDeparturePlaceLabel,
  resolveDepartureCoordinates,
} from "@/utils/parseLatLngFromPlace";
import { statusToKorean } from "@/utils/reservationStatus";
import { cn } from "@/utils/cn";

interface MyReservationDetailPageProps {
  reservationId: number;
}

type ReservationFormSnapshot = {
  departureDate: string;
  departureTime: string;
  departure: string;
  headCount: string;
};

function normalizeDepartureTime(value: string): string {
  const trimmed = value.trim();
  const matched = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!matched) return trimmed;
  return `${matched[1]}:${matched[2]}`;
}

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
      <path
        fill="#d1d3d8"
        d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Z"
      />
      <path fill="#d1d3d8" d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Z" />
    </svg>
  );
}

function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#d1d3d8" />
      <path
        d="M12 7v5l3 2"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="#d1d3d8"
        d="M12 2c-3.87 0-7 3.04-7 6.8 0 4.9 5.6 11 6.3 11.78a.95.95 0 0 0 1.4 0C13.4 19.8 19 13.7 19 8.8 19 5.04 15.87 2 12 2Z"
      />
      <circle cx="12" cy="8.7" r="2.4" fill="#ffffff" />
    </svg>
  );
}

export default function MyReservationDetailPage({ reservationId }: MyReservationDetailPageProps) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [departurePlace, setDeparturePlace] = useState("");
  const [headCount, setHeadCount] = useState("1");
  const [initialForm, setInitialForm] = useState<ReservationFormSnapshot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false);
  const [isPlaceSheetOpen, setIsPlaceSheetOpen] = useState(false);
  const [unavailableState, setUnavailableState] = useState<{ date: string; times: string[] }>({
    date: "",
    times: [],
  });

  /** 수정 중인 예약의 기존 시간은 같은 날짜에서 선택 가능하도록 제외 */
  const unavailableTimes = useMemo(() => {
    const unavailableTimesRaw =
      unavailableState.date === departureDate ? unavailableState.times : [];
    if (!initialForm || departureDate !== initialForm.departureDate) {
      return unavailableTimesRaw;
    }
    return unavailableTimesRaw.filter((t) => t !== initialForm.departureTime);
  }, [unavailableState.date, unavailableState.times, departureDate, initialForm]);

  const canEditOrCancel = detail?.status === "PENDING" || detail?.status === "CONFIRMED";
  const hasChanges =
    initialForm !== null &&
    (departureDate.trim() !== initialForm.departureDate ||
      departureTime.trim() !== initialForm.departureTime ||
      departurePlace.trim() !== initialForm.departure ||
      headCount.trim() !== initialForm.headCount);

  const departurePlaceLabel = formatDeparturePlaceLabel(departurePlace);

  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getReservationById(reservationId);
      setDetail(data);
      setDepartureDate(data.departureDate);
      const normalizedTime = normalizeDepartureTime(data.departureTime);
      setDepartureTime(normalizedTime);
      setDeparturePlace(data.departure);
      setHeadCount(String(data.headCount));
      setInitialForm({
        departureDate: data.departureDate.trim(),
        departureTime: normalizedTime,
        departure: data.departure.trim(),
        headCount: String(data.headCount).trim(),
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!departureDate || !canEditOrCancel) return;
    let cancelled = false;
    void getUnavailableTimes(departureDate)
      .then((times) => {
        if (cancelled) return;
        setUnavailableState({ date: departureDate, times });
        setDepartureTime((prev) => {
          const blocked =
            prev &&
            times.includes(prev) &&
            !(
              initialForm &&
              departureDate === initialForm.departureDate &&
              prev === initialForm.departureTime
            );
          return blocked ? "" : prev;
        });
      })
      .catch(() => {
        if (!cancelled) setUnavailableState({ date: departureDate, times: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [departureDate, canEditOrCancel, initialForm]);

  async function onSaveUpdate() {
    try {
      if (!detail) return;
      setNotice("");
      setError("");
      setIsSaving(true);

      const { lat, lng } = await resolveDepartureCoordinates(departurePlace);

      await updateReservation(detail.id, {
        departureDate: departureDate.trim(),
        departureTime: normalizeDepartureTime(departureTime),
        departure: departurePlace.trim(),
        lat,
        lng,
        headCount: Number.parseInt(headCount, 10),
      });
      setNotice("예약 정보를 수정했습니다.");
      await loadDetail();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function onCancelReservation() {
    if (!detail) return;
    if (!window.confirm("예약을 취소하시겠어요?")) return;
    try {
      setNotice("");
      setError("");
      setIsCancelling(true);
      await cancelReservation(detail.id);
      setNotice("예약이 취소되었습니다.");
      await loadDetail();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsCancelling(false);
    }
  }

  function handlePlaceConfirm(place: string) {
    setDeparturePlace(place);
  }

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="예약 상세"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my-reservations" })}
        />

        <div className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+8px)] sm:pb-[calc(60px+8px)]">
          <div className="bg-white px-[20px] py-[20px]">
            {isLoading ? <p className="text-[#868b94]">불러오는 중...</p> : null}
            {!isLoading && error ? <p className="text-[#d32f2f]">{error}</p> : null}
            {!isLoading && !error && !detail ? (
              <p className="text-[#868b94]">예약 정보를 찾을 수 없습니다.</p>
            ) : null}
            {!isLoading && !error && detail ? (
              <div className="space-y-[8px]">
                <p className="text-[18px] font-bold text-[#1a1c20]">{detail.course.name}</p>
                <p className="text-[14px] text-[#555d6d]">상태: {statusToKorean(detail.status)}</p>
                <p className="text-[14px] text-[#555d6d]">
                  요금: {detail.quotedAmount.toLocaleString()}원
                </p>
              </div>
            ) : null}
          </div>

          {detail ? (
            <div className="space-y-[16px] bg-white px-[20px] py-[20px]">
              <div className="flex w-full flex-col gap-[6px]">
                <span className="text-[14px] text-[#555d6d]">출발일</span>
                <button
                  type="button"
                  disabled={!canEditOrCancel}
                  className={cn(
                    "flex h-[56px] flex-row items-center gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px] text-left disabled:opacity-60",
                  )}
                  onClick={() => setIsDateSheetOpen(true)}
                >
                  <CalendarGlyph />
                  <span
                    className={cn(
                      "flex-1 text-[16px]",
                      departureDate ? "text-[#1a1c20]" : "text-[#d1d3d8]",
                    )}
                  >
                    {departureDate ? formatKoreanDate(departureDate) : "출발일을 선택해주세요"}
                  </span>
                </button>
              </div>

              <div className="flex w-full flex-col gap-[6px]">
                <span className="text-[14px] text-[#555d6d]">출발 시간</span>
                <button
                  type="button"
                  disabled={!canEditOrCancel}
                  className={cn(
                    "flex h-[56px] flex-row items-center gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px] text-left disabled:opacity-60",
                  )}
                  onClick={() => setIsTimeSheetOpen(true)}
                >
                  <ClockGlyph />
                  <span
                    className={cn(
                      "flex-1 text-[16px]",
                      departureTime ? "text-[#1a1c20]" : "text-[#d1d3d8]",
                    )}
                  >
                    {departureTime ? formatKoreanTime(departureTime) : "출발 시간을 선택해주세요"}
                  </span>
                </button>
              </div>

              <div className="flex w-full flex-col gap-[6px]">
                <span className="text-[14px] text-[#555d6d]">출발 장소</span>
                <button
                  type="button"
                  disabled={!canEditOrCancel}
                  className={cn(
                    "flex h-[56px] flex-row items-center gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px] text-left disabled:opacity-60",
                  )}
                  onClick={() => setIsPlaceSheetOpen(true)}
                >
                  <PinGlyph />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[16px]",
                      departurePlaceLabel ? "text-[#1a1c20]" : "text-[#d1d3d8]",
                    )}
                  >
                    {departurePlaceLabel || "출발 장소를 선택해주세요"}
                  </span>
                </button>
              </div>

              <label className="block">
                <span className="mb-[6px] block text-[14px] text-[#555d6d]">탑승 인원</span>
                <input
                  className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px] disabled:opacity-60"
                  type="number"
                  min={1}
                  max={8}
                  disabled={!canEditOrCancel}
                  value={headCount}
                  onChange={(e) => setHeadCount(e.target.value)}
                />
              </label>

              {notice ? <p className="text-[14px] text-[#1f8b4c]">{notice}</p> : null}

              <div className="flex gap-[10px]">
                <button
                  type="button"
                  disabled={!canEditOrCancel || !hasChanges || isSaving}
                  onClick={() => void onSaveUpdate()}
                  className="flex-1 rounded-[10px] bg-[#555d6d] px-[16px] py-[12px] text-white disabled:bg-[#d1d3d8]"
                >
                  {isSaving ? "수정 중..." : "예약 수정"}
                </button>
                <button
                  type="button"
                  disabled={!canEditOrCancel || isCancelling}
                  onClick={() => void onCancelReservation()}
                  className="flex-1 rounded-[10px] bg-[#f04d4d] px-[16px] py-[12px] text-white disabled:bg-[#d1d3d8]"
                >
                  {isCancelling ? "취소 중..." : "예약 취소"}
                </button>
              </div>
              {!canEditOrCancel ? (
                <p className="text-[13px] text-[#868b94]">
                  완료·진행 중·취소된 예약은 수정 또는 취소할 수 없습니다.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <DepartureDateBottomSheet
        open={isDateSheetOpen}
        value={departureDate}
        onClose={() => setIsDateSheetOpen(false)}
        onConfirm={(iso) => {
          setDepartureDate(iso);
          setIsDateSheetOpen(false);
        }}
      />
      <DepartureTimeBottomSheet
        open={isTimeSheetOpen}
        value={departureTime}
        departureDate={departureDate}
        unavailableTimes={unavailableTimes}
        onClose={() => setIsTimeSheetOpen(false)}
        onConfirm={(hhmm) => {
          setDepartureTime(hhmm);
          setIsTimeSheetOpen(false);
        }}
      />
      <DeparturePlaceBottomSheet
        open={isPlaceSheetOpen}
        value={departurePlace}
        onClose={() => setIsPlaceSheetOpen(false)}
        onConfirm={handlePlaceConfirm}
      />

      <BottomNav />
    </MobileFrame>
  );
}
