import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  deleteReservation,
  getMyReservations,
  type ReservationStatus,
  type ReservationSummary,
} from "@/api/reservation";
import { getErrorMessage } from "@/api/types/common";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { statusToKorean } from "@/utils/reservationStatus";

type ReservationFilter = "ALL" | ReservationStatus;

const FILTERS: { label: string; value: ReservationFilter }[] = [
  { label: "전체", value: "ALL" },
  { label: "예약 완료", value: "CONFIRMED" },
  { label: "진행 중", value: "IN_PROGRESS" },
  { label: "완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELLED" },
];

function canDeleteReservation(status: ReservationStatus): boolean {
  return status === "CANCELLED";
}

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReservationFilter>("ALL");
  const [items, setItems] = useState<ReservationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const statusParam = useMemo<ReservationStatus | undefined>(
    () => (filter === "ALL" ? undefined : filter),
    [filter],
  );

  const loadReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const list = await getMyReservations(statusParam);
      setItems(list);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [statusParam]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const handleDelete = async (item: ReservationSummary) => {
    if (!canDeleteReservation(item.status)) return;
    const ok = window.confirm("이 예약을 목록에서 삭제할까요?\n삭제한 예약은 다시 볼 수 없습니다.");
    if (!ok) return;

    try {
      setDeletingId(item.id);
      setError("");
      await deleteReservation(item.id);
      setItems((prev) => prev.filter((r) => r.id !== item.id));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="예약 내역"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my" })}
        />

        <div className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+8px)] sm:pb-[calc(60px+8px)]">
          <div className="flex flex-wrap gap-[8px] bg-white px-[20px] py-[16px]">
            {FILTERS.map((it) => {
              const active = it.value === filter;
              return (
                <button
                  key={it.value}
                  type="button"
                  onClick={() => setFilter(it.value)}
                  className={`rounded-full px-[12px] py-[8px] text-[14px] ${
                    active ? "bg-[#1a1c20] text-white" : "bg-[#f3f4f5] text-[#555d6d]"
                  }`}
                >
                  {it.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 flex-col bg-white">
            {isLoading ? (
              <p className="px-[20px] py-[24px] text-[#868b94]">불러오는 중...</p>
            ) : null}
            {!isLoading && error ? (
              <p className="px-[20px] py-[24px] text-[#d32f2f]">{error}</p>
            ) : null}
            {!isLoading && !error && items.length === 0 ? (
              <p className="px-[20px] py-[24px] text-[#868b94]">예약 내역이 없습니다.</p>
            ) : null}

            {!isLoading && !error
              ? items.map((item) => {
                  const showDelete = canDeleteReservation(item.status);
                  const isDeleting = deletingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="flex items-stretch justify-between gap-[12px] border-b border-[#eeeff1] px-[20px] py-[16px]"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          navigate({
                            to: "/my-reservation-detail",
                            search: { id: item.id },
                          })
                        }
                      >
                        <p className="text-[16px] font-bold text-[#1a1c20]">
                          {item.courseNameSnapshot}
                        </p>
                        <p className="mt-[4px] text-[14px] text-[#555d6d]">{item.departure}</p>
                        <p className="mt-[2px] text-[13px] text-[#868b94]">
                          {item.departureDate} {item.departureTime} · {item.headCount}명
                        </p>
                      </button>
                      <div
                        className={`flex shrink-0 flex-col items-end self-stretch ${
                          showDelete ? "justify-between" : "justify-start"
                        }`}
                      >
                        <span className="text-[13px] text-[#555d6d]">
                          {statusToKorean(item.status)}
                        </span>
                        {showDelete ? (
                          <button
                            type="button"
                            disabled={isDeleting}
                            className="text-[13px] font-medium text-[#d32f2f] underline disabled:opacity-50"
                            onClick={() => void handleDelete(item)}
                          >
                            {isDeleting ? "삭제 중..." : "삭제"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              : null}
          </div>
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
