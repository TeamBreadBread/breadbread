import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  cancelReservation,
  getReservationById,
  updateReservation,
  type ReservationDetail,
  type ReservationStatus,
} from "@/api/reservation";
import { getErrorMessage } from "@/api/types/common";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

interface MyReservationDetailPageProps {
  reservationId: number;
}

type ReservationFormSnapshot = {
  departureDate: string;
  departureTime: string;
  departure: string;
  headCount: string;
  lat: string;
  lng: string;
};

const DEFAULT_LAT = "37.5665";
const DEFAULT_LNG = "126.9780";

function normalizeDepartureTime(value: string): string {
  const trimmed = value.trim();
  const matched = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!matched) return trimmed;
  return `${matched[1]}:${matched[2]}`;
}

function statusToKorean(status: ReservationStatus): string {
  switch (status) {
    case "PENDING":
      return "대기";
    case "CONFIRMED":
      return "확정";
    case "COMPLETED":
      return "완료";
    case "CANCELLED":
      return "취소";
  }
}

export default function MyReservationDetailPage({ reservationId }: MyReservationDetailPageProps) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [departure, setDeparture] = useState("");
  const [headCount, setHeadCount] = useState("1");
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [initialForm, setInitialForm] = useState<ReservationFormSnapshot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const canEditOrCancel = detail?.status === "PENDING" || detail?.status === "CONFIRMED";
  const hasChanges =
    initialForm !== null &&
    (departureDate.trim() !== initialForm.departureDate ||
      departureTime.trim() !== initialForm.departureTime ||
      departure.trim() !== initialForm.departure ||
      headCount.trim() !== initialForm.headCount ||
      lat.trim() !== initialForm.lat ||
      lng.trim() !== initialForm.lng);

  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getReservationById(reservationId);
      setDetail(data);
      setDepartureDate(data.departureDate);
      const normalizedTime = normalizeDepartureTime(data.departureTime);
      setDepartureTime(normalizedTime);
      setDeparture(data.departure);
      setHeadCount(String(data.headCount));
      setInitialForm({
        departureDate: data.departureDate.trim(),
        departureTime: normalizedTime,
        departure: data.departure.trim(),
        headCount: String(data.headCount).trim(),
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
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

  async function onSaveUpdate() {
    try {
      if (!detail) return;
      setNotice("");
      setError("");
      setIsSaving(true);

      await updateReservation(detail.id, {
        departureDate: departureDate.trim(),
        departureTime: normalizeDepartureTime(departureTime),
        departure: departure.trim(),
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
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
            <div className="space-y-[10px] bg-white px-[20px] py-[20px]">
              <label className="block">
                <span className="mb-[6px] block text-[14px] text-[#555d6d]">출발일</span>
                <input
                  className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px]"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-[6px] block text-[14px] text-[#555d6d]">출발 시간</span>
                <input
                  className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px]"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-[6px] block text-[14px] text-[#555d6d]">출발 장소</span>
                <input
                  className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px]"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-[6px] block text-[14px] text-[#555d6d]">탑승 인원</span>
                <input
                  className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px]"
                  type="number"
                  min={1}
                  max={8}
                  value={headCount}
                  onChange={(e) => setHeadCount(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-[10px]">
                <label className="block">
                  <span className="mb-[6px] block text-[14px] text-[#555d6d]">위도(lat)</span>
                  <input
                    className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px]"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-[6px] block text-[14px] text-[#555d6d]">경도(lng)</span>
                  <input
                    className="w-full rounded-[8px] border border-[#dcdee3] px-[12px] py-[10px]"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </label>
              </div>

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
                  완료/취소된 예약은 수정 또는 취소할 수 없습니다.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
