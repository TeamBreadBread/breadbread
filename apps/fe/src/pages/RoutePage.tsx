import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/common/navigation/BottomNav";
import { RouteHeroCard, RouteListSection } from "@/components/domain/route";
import MobileFrame from "@/components/layout/MobileFrame";
import type { RouteCourse } from "@/components/domain/route";

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
  return (
    <MobileFrame className="max-w-[430px]">
      <div className="flex flex-1 flex-col bg-white">
        <AppTopBar title="루트" hideBack />

        <div className="flex flex-col items-center gap-[10px] px-x5 py-x4">
          <RouteHeroCard title="코스 추천받기" description="description" />
          <RouteListSection courses={mockCourses} />
        </div>
      </div>

      <BottomNav
        items={[
          { label: "홈" },
          { label: "루트", active: true },
          { label: "빵터" },
          { label: "MY" },
        ]}
      />
    </MobileFrame>
  );
}
