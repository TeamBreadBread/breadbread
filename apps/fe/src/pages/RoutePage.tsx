import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar } from "@/components/common";
import { RouteHeroCard, RouteListSection } from "@/components/domain/route";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import type { RouteCourse } from "@/components/domain/route";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";
import {
  getCourseDetail,
  getMyCourseRoutes,
  likeCourse,
  removeCourseRoute,
  unlikeCourse,
} from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";

export default function RoutePage() {
  const navigate = useNavigate();
  const { requireLogin, promptLoginOnEnter } = useLoginRequired();
  const loggedIn = isLoggedIn();
  const [courses, setCourses] = useState<RouteCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loggedIn) {
      promptLoginOnEnter("/route");
      return;
    }
    let mounted = true;
    const fetchRoutes = async () => {
      try {
        setIsLoading(true);
        const routeItems = await getMyCourseRoutes();
        if (!mounted) return;
        const withLikes = await Promise.all(
          routeItems.map(async (item) => {
            try {
              const detail = await getCourseDetail(item.courseId);
              return {
                id: String(item.courseId),
                title: item.name,
                duration: item.estimatedTime,
                storeCount: item.bakeryCount,
                bakeryNames: item.bakeryNames ?? [],
                liked: Boolean(detail.liked),
                likeCount: detail.likeCount ?? 0,
              } satisfies RouteCourse;
            } catch {
              return {
                id: String(item.courseId),
                title: item.name,
                duration: item.estimatedTime,
                storeCount: item.bakeryCount,
                bakeryNames: item.bakeryNames ?? [],
                liked: false,
                likeCount: 0,
              } satisfies RouteCourse;
            }
          }),
        );
        setCourses(withLikes);
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
  }, [loggedIn, promptLoginOnEnter]);

  const handleDeleteCourse = async (courseId: string) => {
    const parsed = Number.parseInt(courseId, 10);
    if (!Number.isFinite(parsed)) return;
    try {
      await removeCourseRoute(parsed);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (error) {
      window.alert(getErrorMessage(error));
    }
  };

  const performToggleCourseLike = async (courseId: string) => {
    const parsed = Number.parseInt(courseId, 10);
    if (!Number.isFinite(parsed)) return;
    const prev = courses;
    const target = prev.find((c) => c.id === courseId);
    if (!target) return;
    const optimistic = prev.map((c) =>
      c.id !== courseId
        ? c
        : {
            ...c,
            liked: !c.liked,
            likeCount: c.liked ? Math.max(0, c.likeCount - 1) : c.likeCount + 1,
          },
    );
    setCourses(optimistic);
    try {
      if (target.liked) {
        await unlikeCourse(parsed);
      } else {
        await likeCourse(parsed);
      }
    } catch (error) {
      setCourses(prev);
      window.alert(getErrorMessage(error));
    }
  };

  const handleToggleCourseLike = (courseId: string) => {
    requireLogin(() => {
      void performToggleCourseLike(courseId);
    }, "/route");
  };

  const handleOpenCourse = (courseId: string) => {
    const parsed = Number.parseInt(courseId, 10);
    if (!Number.isFinite(parsed)) return;
    void navigate({ to: "/ai-search-result", search: { courseId: parsed, from: "route" } });
  };

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-white">
        <AppTopBar title="루트" hideBack />

        {loggedIn ? (
          <div className="flex flex-col items-center gap-[10px] px-x5 py-x4">
            <RouteHeroCard
              title="코스 추천받기"
              description="description"
              onClick={() => navigate({ to: AI_COURSE_FLOW_START })}
            />
            {isLoading ? (
              <p className="w-full py-x4 text-center text-size-4 text-gray-700">
                루트 목록 불러오는 중...
              </p>
            ) : null}
            <RouteListSection
              courses={courses}
              onOpenCourse={handleOpenCourse}
              onDeleteCourse={handleDeleteCourse}
              onToggleCourseLike={handleToggleCourseLike}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-x2 px-x5 py-x10 text-center">
            <p className="font-pretendard text-size-5 font-bold leading-t6 text-gray-1000">
              로그인이 필요해요
            </p>
            <p className="font-pretendard text-size-3 leading-t4 text-gray-700">
              내 루트는 로그인 후 이용할 수 있어요.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
