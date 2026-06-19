import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar } from "@/components/common";
import { RouteHeroCard, RouteListSection } from "@/components/domain/route";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import type { RouteCourse } from "@/components/domain/route";
import { saveRouteFocusCourseId } from "@/utils/aiCourseStorage";
import { deleteAiCourse, getMyCourseRoutes, removeCourseRoute } from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { useAiCourseEntry } from "@/hooks/useAiCourseEntry";

export default function RoutePage() {
  const navigate = useNavigate();
  const { courseGuideActive, courseGuideId } = useLoginRequired();
  const { startAiCourseEntry, preferenceRequiredDialog } = useAiCourseEntry("/route");
  const [courses, setCourses] = useState<RouteCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchRoutes = async () => {
      try {
        setIsLoading(true);
        const routeItems = await getMyCourseRoutes();
        if (!mounted) return;
        setCourses(
          routeItems.map((item) => ({
            id: String(item.courseId),
            title: item.name,
            duration: item.estimatedTime,
            storeCount: item.bakeryCount,
            bakeryNames: item.bakeryNames ?? [],
          })),
        );
      } catch (error) {
        window.alert(getErrorMessage(error));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void fetchRoutes();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteCourse = async (courseId: string) => {
    const parsed = Number.parseInt(courseId, 10);
    if (!Number.isFinite(parsed)) return;
    if (!window.confirm("이 AI 코스를 삭제할까요? 저장된 루트에서도 제거됩니다.")) return;

    try {
      await deleteAiCourse(parsed);
      await removeCourseRoute(parsed).catch(() => undefined);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  const handleOpenCourse = (courseId: string) => {
    const parsed = Number.parseInt(courseId, 10);
    if (!Number.isFinite(parsed)) return;
    saveRouteFocusCourseId(parsed);
    void navigate({ to: "/ai-search-result", search: { courseId: parsed, from: "route" } });
  };

  return (
    <MobileFrame>
      {preferenceRequiredDialog}
      <div className="flex flex-1 flex-col bg-white">
        <AppTopBar title="루트" hideBack />

        <div className="flex flex-col items-center gap-[10px] px-x5 py-x4">
          <RouteHeroCard
            title="AI 빵집 추천"
            description="내 취향 빵집 찾아보기"
            onClick={startAiCourseEntry}
          />
          {isLoading ? (
            <p className="w-full py-x4 text-center text-size-4 text-gray-700">
              루트 목록 불러오는 중...
            </p>
          ) : null}
          <RouteListSection
            courses={courses}
            activeGuideCourseId={courseGuideActive ? courseGuideId : null}
            onOpenCourse={handleOpenCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
