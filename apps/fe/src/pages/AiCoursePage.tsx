import { cn } from "@/utils/cn";
import {
  CourseTimeline,
  MobileFrame,
  RESULT_CTA_HEIGHT_CLASS,
  ResultCTASection,
  ResultSummaryCard,
  ResultTopBar,
} from "@/components";
import mapImage from "@/assets/images/map.png";
import handleArrow from "@/assets/icons/handle_arrowup.png";
import { useState } from "react";

const courses = [
  {
    name: "성심당 본점",
    address: "대전 중구 대종로480번길 15",
    menu: "소보로, 튀김소보로",
  },
  {
    name: "몽심 대흥점",
    address: "대전 중구 중교로 32 1층",
    menu: "크루아상, 스콘",
  },
  {
    name: "땡큐베리머치",
    address: "대전 중구 중교로 49",
    menu: "케이크, 마카롱",
  },
  {
    name: "뮤제 베이커리",
    address: "대전 중구 대흥로121번길 44",
    menu: "마들렌, 샌드위치",
  },
];

export default function AiCoursePage() {
  const [isSheetOpen, setIsSheetOpen] = useState(true);

  return (
    <MobileFrame className="relative h-[calc(100vh-var(--spacing-x8))] overflow-hidden">
      <section className="relative h-full">
        <ResultTopBar title="AI 추천 코스" />

        <div className="px-x5 pt-x4">
          <ResultSummaryCard title="커플을 위한 달콤한 빵투어" duration="3~4시간" price="3만원" />
        </div>

        <div className="flex justify-center px-x5 pt-x4">
          <div className="relative h-[200px] w-[402px] max-w-full overflow-hidden rounded-r3 md:h-[280px] md:w-[620px]">
            <img
              src={mapImage}
              alt="코스 대표 지도"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <aside
          className={cn(
            "absolute inset-x-0 z-20 bg-gray-00",
            "overflow-hidden transition-all duration-700 ease-in-out",
            isSheetOpen
              ? "bottom-[calc(var(--spacing-x16)+var(--spacing-x2))] h-[58%] rounded-t-r5"
              : "top-x14 bottom-0 h-auto rounded-none",
          )}
        >
          <div className="flex justify-center py-x2">
            <button
              type="button"
              aria-label="바텀시트 핸들"
              aria-expanded={isSheetOpen}
              onClick={() => setIsSheetOpen((prev) => !prev)}
              className={cn(
                "flex h-x6 w-x16 items-center justify-center rounded-full bg-gray-00",
                "outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-00",
              )}
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
              "sheet-scrollbar h-[calc(100%-var(--spacing-x6))] overflow-y-auto pb-x4",
              RESULT_CTA_HEIGHT_CLASS,
            )}
          >
            <CourseTimeline courses={courses} />
          </div>
        </aside>
      </section>

      <ResultCTASection />
    </MobileFrame>
  );
}
