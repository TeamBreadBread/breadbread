import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getMyReservations,
  type ReservationStatus,
  type ReservationSummary,
} from "@/api/reservation";
import { getErrorMessage } from "@/api/types/common";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

type ReservationFilter = "ALL" | ReservationStatus;

const FILTERS: { label: string; value: ReservationFilter }[] = [
  { label: "전체", value: "ALL" },
  { label: "대기", value: "PENDING" },
  { label: "확정", value: "CONFIRMED" },
  { label: "완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELLED" },
];

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

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReservationFilter>("ALL");
  const [items, setItems] = useState<ReservationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const statusParam = useMemo<ReservationStatus | undefined>(
    () => (filter === "ALL" ? undefined : filter),
    [filter],
  );

  useEffect(() => {
    void (async () => {
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
    })();
  }, [statusParam]);

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
              ? items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="border-b border-[#eeeff1] px-[20px] py-[16px] text-left"
                    onClick={() =>
                      navigate({
                        to: "/my-reservation-detail",
                        search: { id: item.id },
                      })
                    }
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-bold text-[#1a1c20]">
                        {item.courseNameSnapshot}
                      </p>
                      <span className="text-[13px] text-[#555d6d]">
                        {statusToKorean(item.status)}
                      </span>
                    </div>
                    <p className="mt-[4px] text-[14px] text-[#555d6d]">{item.departure}</p>
                    <p className="mt-[2px] text-[13px] text-[#868b94]">
                      {item.departureDate} {item.departureTime} · {item.headCount}명
                    </p>
                  </button>
                ))
              : null}
          </div>
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
