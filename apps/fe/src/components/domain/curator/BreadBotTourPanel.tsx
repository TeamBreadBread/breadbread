import { useCallback, useEffect, useState } from "react";
import { getBakeriesCongestion } from "@/api/bakery";
import { getCourseDetail, type CourseDetail } from "@/api/courses";
import {
  checkTourVisit,
  completeTour,
  getCurrentTour,
  type TourCurrentResponse,
} from "@/api/tours";
import { getErrorMessage } from "@/api/types/common";
import CongestionBadge from "@/components/common/CongestionBadge";
import { useTourStateSync } from "@/hooks/useTourStateSync";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { mapCongestionByBakeryId } from "@/utils/congestionCheck";
import { notifyTourCompleteCelebration } from "@/utils/tourCelebration";
import { trackBakeryVisitChecked, trackTourCompleted } from "@/lib/analytics/gtag";
import { cn } from "@/utils/cn";

type BreadBotTourPanelProps = {
  courseId: number;
  /** 투어 진행 탭이 보일 때만 원격 상태·재조회 반영 */
  active?: boolean;
  /** "전체 화면으로 보기" — 모달을 닫고 /tour 페이지로 이동 */
  onOpenFullPage: () => void;
};

type CongestionInfo = { level?: string | null; expectedWaitMin?: number | null };

/**
 * 챗봇 모달 안에서 보여주는 컴팩트 투어 진행 패널.
 * TourPage와 동일한 API(현재 투어/방문 체크/완료)를 사용한다.
 */
export default function BreadBotTourPanel({
  courseId,
  active = true,
  onOpenFullPage,
}: BreadBotTourPanelProps) {
  const { endCourseGuide, startCelebrationPending } = useLoginRequired();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [tour, setTour] = useState<TourCurrentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrder, setBusyOrder] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [congestionByBakeryId, setCongestionByBakeryId] = useState<Map<number, CongestionInfo>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [detail, current] = await Promise.all([getCourseDetail(courseId), getCurrentTour()]);
        if (cancelled) return;
        setCourse(detail);
        if (current && current.courseId === courseId) {
          setTour(current);
        } else {
          setError("진행 중인 투어 정보를 찾지 못했어요.");
        }
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    const bakeryIds = course?.bakeries?.map((bakery) => bakery.id).filter((id) => id > 0) ?? [];
    if (bakeryIds.length === 0) return;

    let cancelled = false;
    void getBakeriesCongestion(bakeryIds)
      .then((items) => {
        if (cancelled) return;
        const mapped = mapCongestionByBakeryId(items);
        setCongestionByBakeryId(
          new Map(
            [...mapped.entries()].map(([id, item]) => [
              id,
              { level: item.level, expectedWaitMin: item.expectedWaitMin },
            ]),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setCongestionByBakeryId(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, [course]);

  const handleTourUpdated = useCallback(
    (updated: TourCurrentResponse) => {
      setTour(updated);
      if (updated.status === "COMPLETED") {
        startCelebrationPending(courseId);
        notifyTourCompleteCelebration(courseId);
        endCourseGuide();
      }
    },
    [courseId, endCourseGuide, startCelebrationPending],
  );

  useTourStateSync({
    courseId,
    active,
    onRemoteUpdate: handleTourUpdated,
  });

  const handleVisit = async (order: number) => {
    if (busyOrder != null || isCompleting) return;
    setBusyOrder(order);
    setError("");
    try {
      trackBakeryVisitChecked(courseId, order);
      handleTourUpdated(await checkTourVisit(courseId, order));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyOrder(null);
    }
  };

  const handleComplete = async () => {
    if (isCompleting || busyOrder != null) return;
    setIsCompleting(true);
    setError("");
    try {
      trackTourCompleted(courseId);
      handleTourUpdated(await completeTour(courseId));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-x8">
        <p className="font-pretendard text-size-3 text-gray-500">투어 정보를 불러오고 있어요…</p>
      </div>
    );
  }

  const bakeries = course?.bakeries ?? [];
  const total = bakeries.length || tour?.remainingCount || 0;
  const visitedCount = tour?.currentVisitOrder ?? 0;
  const isCompleted = tour?.status === "COMPLETED";
  const progressPct = total > 0 ? Math.min(100, Math.round((visitedCount / total) * 100)) : 0;
  const nextOrder = visitedCount + 1;

  return (
    <div className="flex flex-col gap-x3">
      {/* 진행 상태 */}
      <div className="rounded-r4 bg-gray-00 px-x4 py-x4 shadow-[0_1px_3px_rgba(26,31,39,0.05)]">
        <p className="font-pretendard text-size-4 font-bold text-gray-1000">
          {course?.name?.trim() || "빵 투어"}
        </p>
        {isCompleted ? (
          <p className="mt-x1 font-pretendard text-size-3 font-medium text-orange-600">
            투어를 완료했어요! 🎉
          </p>
        ) : (
          <p className="mt-x1 font-pretendard text-size-3 text-gray-700">
            {total > 0
              ? `${visitedCount} / ${total} 곳 방문 완료`
              : "방문할 빵집을 불러오고 있어요"}
          </p>
        )}
        <div className="mt-x2 h-[8px] w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-orange-600 transition-[width] duration-300"
            style={{ width: `${isCompleted ? 100 : progressPct}%` }}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-r4 bg-gray-00 px-x4 py-x3 shadow-[0_1px_3px_rgba(26,31,39,0.05)]">
          <p className="font-pretendard text-size-3 text-[#d32f2f]">{error}</p>
        </div>
      ) : null}

      {/* 빵집 방문 체크 리스트 */}
      {bakeries.length > 0 ? (
        <div className="flex flex-col gap-x2 rounded-r4 bg-gray-00 px-x3 py-x3 shadow-[0_1px_3px_rgba(26,31,39,0.05)]">
          {bakeries.map((bakery, idx) => {
            const order = idx + 1;
            const visited = order <= visitedCount;
            const isNext = !isCompleted && order === nextOrder;
            const locked = !visited && !isNext;
            const congestion = congestionByBakeryId.get(bakery.id);
            return (
              <div
                key={bakery.id}
                className={cn(
                  "flex items-center gap-x2 rounded-r3 border px-x3 py-x2",
                  visited
                    ? "border-orange-200 bg-orange-50"
                    : isNext
                      ? "border-orange-300 bg-gray-00"
                      : "border-gray-100 bg-gray-00",
                )}
              >
                <span
                  className={cn(
                    "flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full font-pretendard text-size-2 font-bold",
                    visited ? "bg-orange-600 text-gray-00" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {visited ? "✓" : order}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate font-pretendard text-size-3 font-medium",
                      locked ? "text-gray-400" : "text-gray-1000",
                    )}
                  >
                    {bakery.name}
                  </span>
                  {congestion?.level ? (
                    <CongestionBadge
                      level={congestion.level}
                      expectedWaitMin={congestion.expectedWaitMin}
                      className="mt-[2px]"
                    />
                  ) : null}
                </div>
                {isNext ? (
                  <button
                    type="button"
                    disabled={busyOrder != null}
                    onClick={() => void handleVisit(order)}
                    className="shrink-0 rounded-r2 bg-orange-600 px-x3 py-x2 font-pretendard text-size-2 font-bold text-gray-00 disabled:bg-gray-300"
                  >
                    {busyOrder === order ? "처리 중…" : "방문 체크"}
                  </button>
                ) : visited ? (
                  <span className="shrink-0 font-pretendard text-size-2 font-medium text-orange-600">
                    방문
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* 액션 버튼 */}
      <div className="flex gap-x2">
        <button
          type="button"
          onClick={onOpenFullPage}
          className="h-[44px] flex-1 rounded-r3 bg-gray-00 font-pretendard text-size-3 font-medium text-gray-1000 shadow-[0_1px_2px_rgba(26,31,39,0.05)] transition-colors hover:bg-gray-200"
        >
          전체 화면
        </button>
        {!isCompleted ? (
          <button
            type="button"
            disabled={isCompleting || busyOrder != null || total === 0}
            onClick={() => void handleComplete()}
            className="h-[44px] flex-1 rounded-r3 bg-orange-600 font-pretendard text-size-3 font-bold text-gray-00 disabled:bg-gray-300"
          >
            {isCompleting ? "처리 중…" : "투어 완료"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
