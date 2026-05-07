import { AppTopBar, Button } from "@/components/common";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { MobileFrame } from "@/components/layout";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";
import CourseTimeline from "@/components/domain/ai-course/CourseTimeline";
import ResultSummaryCard from "@/components/domain/ai-course/ResultSummaryCard";
import type { CoursePlace, CourseSummary } from "@/components/domain/ai-course/types";
import { getDevFallbackCourseId } from "@/lib/courseIdFallback";
import mapImage from "@/assets/images/map.png";
import handleArrow from "@/assets/icons/handle_arrowup.png";
import { useAiSearchBottomSheet } from "@/hooks/useAiSearchBottomSheet";
import { AI_COURSE_RESULT_STORAGE_KEY } from "@/utils/aiCourseStorage";
import type { CourseDetail } from "@/api/courses";

const summary: CourseSummary = {
  title: "커플을 위한 달콤한 빵투어",
  duration: "3~4시간",
  price: "3만원",
};

const places: CoursePlace[] = [
  {
    id: "1",
    name: "성심당 본점",
    address: "대전 중구 대종로480번길 15",
    menu: "소보로, 튀김소보로",
  },
  { id: "2", name: "몽심 대흥점", address: "대전 중구 중교로 32 1층", menu: "크루아상, 스콘" },
  { id: "3", name: "땡큐베리머치", address: "대전 중구 중교로 49", menu: "케이크, 마카롱" },
  {
    id: "4",
    name: "뮤제 베이커리",
    address: "대전 중구 대흥로121번길 44",
    menu: "마들렌, 샌드위치",
  },
];

type AISearchResultPageProps = {
  courseId: number | null;
};

export default function AISearchResultPage({ courseId }: AISearchResultPageProps) {
  const navigate = useNavigate();
  const effectiveCourseId = courseId ?? getDevFallbackCourseId();
  const storedCourseDetail = useMemo((): CourseDetail | null => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(AI_COURSE_RESULT_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CourseDetail;
    } catch {
      return null;
    }
  }, []);

  const dynamicSummary: CourseSummary | null = useMemo(() => {
    if (!storedCourseDetail) return null;
    const costLabel =
      Number.isFinite(storedCourseDetail.estimatedCost) && storedCourseDetail.estimatedCost > 0
        ? `${storedCourseDetail.estimatedCost.toLocaleString("ko-KR")}원`
        : summary.price;
    return {
      title: storedCourseDetail.name || summary.title,
      duration: storedCourseDetail.estimatedTime || summary.duration,
      price: costLabel,
    };
  }, [storedCourseDetail]);

  const dynamicPlaces: CoursePlace[] | null = useMemo(() => {
    if (!storedCourseDetail) return null;
    if (!Array.isArray(storedCourseDetail.bakeries)) return null;
    return storedCourseDetail.bakeries.map((bakery, index) => {
      return {
        id: String(bakery.id ?? index + 1),
        name: bakery.name || `빵집 ${index + 1}`,
        address: bakery.address || "",
        menu: Number.isFinite(bakery.rating) ? `평점 ${bakery.rating}` : "빵집 정보",
      };
    });
  }, [storedCourseDetail]);

  const { sheetRef, contentRef, isDragging, isHalfSheet, togglePhase } = useAiSearchBottomSheet();

  const goBreadTaxiReserve = () => {
    if (!effectiveCourseId) {
      window.alert(
        "예약 가능한 코스 정보를 찾지 못했습니다. 개발 환경에서는 VITE_DEV_FALLBACK_COURSE_ID를 설정해 주세요.",
      );
      return;
    }
    navigate({ to: "/taxi-reserve", search: { courseId: effectiveCourseId } });
  };

  return (
    <MobileFrame className="relative h-screen overflow-hidden bg-white">
      <div className="relative h-full flex-1 bg-white">
        <AppTopBar title="AI 추천 코스" onBack={() => navigate({ to: "/home" })} />
        <ResultSummaryCard summary={dynamicSummary ?? summary} />

        <div className="h-[200px] w-full overflow-hidden">
          <img src={mapImage} alt="코스 지도" className="h-full w-full object-cover" />
        </div>
      </div>

      <aside
        ref={sheetRef}
        className={cn(
          "absolute inset-x-0 z-20 overflow-hidden rounded-t-r5 bg-white",
          !isDragging && "transition-[top] duration-300 ease-out",
        )}
        style={{ bottom: 0 }}
      >
        <div className="flex justify-center py-[14px]">
          <button
            type="button"
            data-ai-sheet-handle="true"
            aria-label="바텀시트 핸들"
            aria-expanded={isHalfSheet}
            onClick={togglePhase}
            className="flex h-x6 w-x16 items-center justify-center rounded-full bg-white outline-none"
          >
            <img
              src={handleArrow}
              alt=""
              className={cn(
                "h-[9px] w-[47px] object-contain transition-transform duration-300 ease-out",
                isHalfSheet ? "rotate-0" : "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>

        <div
          ref={contentRef}
          className={cn(
            "sheet-scrollbar h-[calc(100%-24px)] overflow-y-auto",
            "pb-[calc(96px+env(safe-area-inset-bottom))]",
          )}
        >
          <CourseTimeline places={dynamicPlaces ?? places} />
        </div>
      </aside>

      <div
        className={cn(
          "fixed bottom-0 left-1/2 z-30 -translate-x-1/2 border-t border-gray-300 bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-x3",
          RESPONSIVE_FRAME_WIDTH,
        )}
      >
        <Button variant="primary" fullWidth type="button" onClick={goBreadTaxiReserve}>
          빵택시 예약
        </Button>
      </div>
    </MobileFrame>
  );
}
