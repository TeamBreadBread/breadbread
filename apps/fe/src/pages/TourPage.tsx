import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCourseDetail, type CourseDetail } from "@/api/courses";
import {
  checkTourVisit,
  completeTour,
  getCurrentTour,
  startTour,
  type TourCurrentResponse,
} from "@/api/tours";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { cn } from "@/utils/cn";

interface TourPageProps {
  courseId: number;
}

/** start 응답에는 currentVisitOrder가 없어 0으로 본다. */
function visitedCountOf(tour: TourCurrentResponse | null): number {
  return tour?.currentVisitOrder ?? 0;
}

export default function TourPage({ courseId }: TourPageProps) {
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [tour, setTour] = useState<TourCurrentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrder, setBusyOrder] = useState<number | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const init = useCallback(async () => {
    if (courseId <= 0) {
      setError("코스 정보가 없습니다.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const detail = await getCourseDetail(courseId);
      setCourse(detail);

      // 진행 중인 투어가 이 코스면 그대로 사용, 없으면 새로 시작
      const current = await getCurrentTour();
      if (current && current.courseId === courseId) {
        setTour(current);
      } else if (current && current.courseId !== courseId && current.status === "IN_PROGRESS") {
        setError("다른 코스의 투어가 진행 중이에요. 먼저 진행 중인 투어를 완료해 주세요.");
      } else {
        try {
          const started = await startTour(courseId);
          setTour({
            courseId: started.courseId,
            currentVisitOrder: 0,
            remainingCount: started.totalBakeryCount,
            status: started.status,
          });
        } catch (e) {
          // 이미 진행 중(409)이면 현재 투어를 다시 조회해 복구
          if (e instanceof ApiBusinessError) {
            const retry = await getCurrentTour();
            if (retry && retry.courseId === courseId) {
              setTour(retry);
            } else {
              setError(getErrorMessage(e));
            }
          } else {
            throw e;
          }
        }
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void init();
  }, [init]);

  const handleVisit = async (order: number) => {
    if (busyOrder != null || isCompleting) return;
    setBusyOrder(order);
    setError("");
    try {
      const updated = await checkTourVisit(courseId, order);
      setTour(updated);
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
      const updated = await completeTour(courseId);
      setTour(updated);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsCompleting(false);
    }
  };

  const bakeries = course?.bakeries ?? [];
  const total = bakeries.length || tour?.remainingCount || 0;
  const visitedCount = visitedCountOf(tour);
  const isCompleted = tour?.status === "COMPLETED";
  const progressPct = total > 0 ? Math.min(100, Math.round((visitedCount / total) * 100)) : 0;
  const nextOrder = visitedCount + 1;

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="빵 투어"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/home" })}
        />

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[14px] text-[#868b94]">투어를 준비하고 있어요…</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+90px)] sm:pb-[calc(60px+90px)]">
            {/* 진행 상태 */}
            <div className="flex flex-col gap-[12px] bg-white px-[20px] py-[20px]">
              <p className="text-[18px] font-bold text-[#1a1c20]">
                {course?.name?.trim() || "빵 투어"}
              </p>
              {isCompleted ? (
                <p className="text-[14px] font-medium text-orange-600">
                  투어를 완료했어요! 🎉 오늘도 달콤한 빵 여행 고생하셨어요.
                </p>
              ) : (
                <p className="text-[14px] text-[#555d6d]">
                  {total > 0
                    ? `${visitedCount} / ${total} 곳 방문 완료`
                    : "방문할 빵집을 불러오고 있어요"}
                </p>
              )}
              <div className="h-[8px] w-full overflow-hidden rounded-full bg-[#eeeff1]">
                <div
                  className="h-full rounded-full bg-orange-600 transition-[width] duration-300"
                  style={{ width: `${isCompleted ? 100 : progressPct}%` }}
                />
              </div>
            </div>

            {error ? (
              <div className="bg-white px-[20px] py-[12px]">
                <p className="text-[14px] text-[#d32f2f]">{error}</p>
              </div>
            ) : null}

            {/* 빵집 방문 체크 리스트 */}
            <div className="flex flex-col gap-[10px] bg-white px-[20px] py-[20px]">
              {bakeries.map((bakery, idx) => {
                const order = idx + 1;
                const visited = order <= visitedCount;
                const isNext = !isCompleted && order === nextOrder;
                const locked = !visited && !isNext;
                return (
                  <div
                    key={bakery.id}
                    className={cn(
                      "flex items-center gap-[12px] rounded-[12px] border px-[14px] py-[12px]",
                      visited
                        ? "border-orange-200 bg-orange-50"
                        : isNext
                          ? "border-orange-300 bg-white"
                          : "border-[#eeeff1] bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                        visited ? "bg-orange-600 text-white" : "bg-[#eeeff1] text-[#868b94]",
                      )}
                    >
                      {visited ? "✓" : order}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          "truncate text-[15px] font-medium",
                          locked ? "text-[#b0b3ba]" : "text-[#1a1c20]",
                        )}
                      >
                        {bakery.name}
                      </span>
                      <span className="truncate text-[12px] text-[#868b94]">{bakery.address}</span>
                    </div>
                    {isNext ? (
                      <button
                        type="button"
                        disabled={busyOrder != null}
                        onClick={() => void handleVisit(order)}
                        className="shrink-0 rounded-[8px] bg-orange-600 px-[12px] py-[8px] text-[13px] font-bold text-white disabled:bg-[#d1d3d8]"
                      >
                        {busyOrder === order ? "처리 중…" : "방문 체크"}
                      </button>
                    ) : visited ? (
                      <span className="shrink-0 text-[13px] font-medium text-orange-600">방문</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 CTA */}
      {!isLoading ? (
        <div className="fixed bottom-[56px] left-1/2 z-40 w-full max-w-[402px] -translate-x-1/2 border-t border-[#eeeff1] bg-white px-[20px] py-[12px] sm:bottom-[60px]">
          {isCompleted ? (
            <button
              type="button"
              onClick={() => navigate({ to: "/home" })}
              className="h-[52px] w-full rounded-[12px] bg-gray-900 text-[16px] font-bold text-white"
            >
              홈으로 돌아가기
            </button>
          ) : (
            <button
              type="button"
              disabled={isCompleting || busyOrder != null || total === 0}
              onClick={() => void handleComplete()}
              className="h-[52px] w-full rounded-[12px] bg-orange-600 text-[16px] font-bold text-white disabled:bg-[#d1d3d8]"
            >
              {isCompleting ? "완료 처리 중…" : "투어 완료하기"}
            </button>
          )}
        </div>
      ) : null}

      <BottomNav />
    </MobileFrame>
  );
}
