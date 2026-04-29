import { AppTopBar, Button } from "@/components/common";
import { useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/layout";
import { cn } from "@/utils/cn";
import CourseTimeline from "@/components/domain/ai-course/CourseTimeline";
import ResultSummaryCard from "@/components/domain/ai-course/ResultSummaryCard";
import type { CoursePlace, CourseSummary } from "@/components/domain/ai-course/types";
import mapImage from "@/assets/images/map.png";
import handleArrow from "@/assets/icons/handle_arrowup.png";
import { useAiSearchBottomSheet } from "@/hooks/useAiSearchBottomSheet";

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

export default function AISearchResultPage() {
  const navigate = useNavigate();

  const { sheetRef, contentRef, isDragging, isHalfSheet, togglePhase } = useAiSearchBottomSheet();

  const goBreadTaxiReserve = () => {
    navigate({ to: "/route" });
  };

  return (
    <MobileFrame className="relative h-screen overflow-hidden bg-white">
      <div className="relative h-full flex-1 bg-white">
        <AppTopBar title="AI 추천 코스" onBack={() => navigate({ to: "/home" })} />
        <ResultSummaryCard summary={summary} />

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
          <CourseTimeline places={places} />
        </div>
      </aside>

      <div className="absolute inset-x-0 bottom-0 z-30 mx-auto max-w-[744px] w-full border-t border-gray-300 bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-x3">
        <Button variant="primary" fullWidth type="button" onClick={goBreadTaxiReserve}>
          빵택시 예약
        </Button>
      </div>
    </MobileFrame>
  );
}
