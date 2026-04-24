import { AppTopBar, BottomDoubleCTA } from "@/components/common";
import { useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/layout";
import { cn } from "@/utils/cn";
import CourseTimeline from "@/components/domain/ai-course/CourseTimeline";
import ResultSummaryCard from "@/components/domain/ai-course/ResultSummaryCard";
import SaveRouteBanner from "@/components/domain/ai-course/SaveRouteBanner";
import type { CoursePlace, CourseSummary } from "@/components/domain/ai-course/types";
import mapImage from "@/assets/images/map.png";
import handleArrow from "@/assets/icons/handle_arrowup.png";
import { useEffect, useRef, useState } from "react";

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
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [isSaveBannerVisible, setIsSaveBannerVisible] = useState(false);
  const hideBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hideBannerTimerRef.current) {
        clearTimeout(hideBannerTimerRef.current);
      }
    },
    [],
  );

  const handleSaveClick = () => {
    setIsSaveBannerVisible(true);

    if (hideBannerTimerRef.current) {
      clearTimeout(hideBannerTimerRef.current);
    }

    hideBannerTimerRef.current = setTimeout(() => {
      setIsSaveBannerVisible(false);
      hideBannerTimerRef.current = null;
    }, 5000);
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
        className={cn(
          "absolute inset-x-0 z-20 bg-white transition-all duration-700 ease-in-out",
          isSheetOpen
            ? "bottom-0 h-[50%] rounded-t-r5"
            : "top-[304px] bottom-0 h-auto rounded-none",
        )}
      >
        <div className="flex justify-center py-[14px]">
          <button
            type="button"
            aria-label="바텀시트 핸들"
            aria-expanded={isSheetOpen}
            onClick={() => setIsSheetOpen((prev) => !prev)}
            className="flex h-x6 w-x16 items-center justify-center rounded-full bg-white outline-none"
          >
            <img
              src={handleArrow}
              alt=""
              className={cn(
                "h-[9px] w-[47px] object-contain transition-transform duration-700 ease-in-out",
                isSheetOpen ? "rotate-0" : "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>

        <div
          className={cn(
            "sheet-scrollbar h-[calc(100%-24px)] overflow-y-auto",
            isSaveBannerVisible
              ? "pb-[calc(196px+env(safe-area-inset-bottom))]"
              : "pb-[calc(140px+env(safe-area-inset-bottom))]",
          )}
        >
          <CourseTimeline places={places} />
        </div>
      </aside>

      <div className="absolute inset-x-0 bottom-0 z-30">
        <div
          className={cn(
            "mx-auto max-w-[744px] overflow-hidden transition-all duration-200 ease-out",
            isSaveBannerVisible ? "max-h-[56px] opacity-100" : "max-h-0 opacity-0",
          )}
          aria-hidden={!isSaveBannerVisible}
        >
          <SaveRouteBanner onActionClick={() => navigate({ to: "/route" })} />
        </div>
        <BottomDoubleCTA
          leftText="다시 추천"
          rightText="코스 저장"
          onRightClick={handleSaveClick}
        />
      </div>
    </MobileFrame>
  );
}
