import { useNavigate } from "@tanstack/react-router";
import { AppTopBar } from "@/components/common";
import { RouteHeroCard, RouteListSection } from "@/components/domain/route";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import type { RouteCourse } from "@/components/domain/route";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";

const mockCourses: RouteCourse[] = [
  {
    id: "route-1",
    title: "커플을 위한 달콤한 빵투어",
    duration: "3~4시간",
    storeCount: 4,
  },
  {
    id: "route-2",
    title: "커플을 위한 달콤한 빵투어",
    duration: "3~4시간",
    storeCount: 4,
  },
  {
    id: "route-3",
    title: "커플을 위한 달콤한 빵투어",
    duration: "3~4시간",
    storeCount: 4,
  },
  {
    id: "route-4",
    title: "커플을 위한 달콤한 빵투어",
    duration: "3~4시간",
    storeCount: 4,
  },
];

export default function RoutePage() {
  const navigate = useNavigate();

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-white">
        <AppTopBar title="루트" hideBack />

        <div className="flex flex-col items-center gap-[10px] px-x5 py-x4">
          <RouteHeroCard
            title="코스 추천받기"
            description="description"
            onClick={() => navigate({ to: AI_COURSE_FLOW_START })}
          />
          <RouteListSection courses={mockCourses} />
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
