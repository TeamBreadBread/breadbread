import { cn } from "@/utils/cn";
import CourseTimeline from "@/components/domain/ai-course/CourseTimeline";
import ResultCTASection from "@/components/domain/ai-course/ResultCTASection";
import ResultSummaryCard from "@/components/domain/ai-course/ResultSummaryCard";
import ResultTopBar from "@/components/domain/ai-course/ResultTopBar";
import MobileFrame from "@/components/layout/MobileFrame";
import { RESULT_CTA_HEIGHT_CLASS } from "@/components/domain/ai-course/ResultCTASection";
import mapImage from "@/assets/images/map.png";

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
  return (
    <MobileFrame className="flex flex-col">
      <ResultTopBar title="AI 추천 코스" />

      <div className={cn("flex-1 overflow-y-auto", RESULT_CTA_HEIGHT_CLASS)}>
        <ResultSummaryCard title="커플을 위한 달콤한 빵투어" duration="3~4시간" price="3만원" />

        <section className={cn("px-x5 pb-x3")}>
          <img
            src={mapImage}
            alt="코스 대표 지도"
            className={cn("mx-auto h-[180px] w-full", "max-w-[390px] rounded-r3 object-cover")}
            loading="lazy"
          />
        </section>

        <CourseTimeline courses={courses} />
      </div>

      <ResultCTASection />
    </MobileFrame>
  );
}
