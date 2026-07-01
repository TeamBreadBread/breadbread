import { useEffect, useMemo, useState } from "react";
import { getCourseDetail, type CourseDetail } from "@/api/courses";
import CourseKakaoMap from "@/components/domain/ai-course/CourseKakaoMap";
import { courseBakeriesToMapPoints } from "@/components/domain/ai-course/courseMapPoints";
import type { CourseMapBakery } from "@/components/domain/ai-course/CourseKakaoMap";
import { useCourseRoutePath } from "@/hooks/useCourseRoutePath";
import { resolveAiCourseDeparturePoint } from "@/lib/aiCourseDepartureCoords";

type BreadBotCourseMapCardProps = {
  courseId: number;
  onDetailClick: () => void;
};

export default function BreadBotCourseMapCard({
  courseId,
  onDetailClick,
}: BreadBotCourseMapCardProps) {
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [bakeries, setBakeries] = useState<CourseMapBakery[]>([]);
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(null);
  const loading = resolvedCourseId !== courseId;
  const { routePath, routeLoading } = useCourseRoutePath(courseId);

  const departurePoint = useMemo(
    () =>
      resolveAiCourseDeparturePoint({
        courseId,
        departureLatitude: courseDetail?.departureLatitude,
        departureLongitude: courseDetail?.departureLongitude,
      }),
    [courseId, courseDetail?.departureLatitude, courseDetail?.departureLongitude],
  );

  useEffect(() => {
    let cancelled = false;
    void getCourseDetail(courseId)
      .then((detail) => {
        if (cancelled) return;
        setCourseDetail(detail);
        setBakeries(courseBakeriesToMapPoints(detail.bakeries ?? []));
        setResolvedCourseId(courseId);
      })
      .catch(() => {
        if (!cancelled) {
          setCourseDetail(null);
          setBakeries([]);
          setResolvedCourseId(courseId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <div className="w-full overflow-hidden rounded-r4 bg-gray-100 p-x3 shadow-[0_2px_8px_rgba(26,31,39,0.06)]">
      <p className="mb-x2 font-pretendard text-size-2 font-medium leading-t3 text-gray-700">
        {courseDetail?.name?.trim() || "추천 코스"}
      </p>
      <div className="h-[148px] overflow-hidden rounded-r3 bg-gray-200">
        {loading ? (
          <div className="flex h-full items-center justify-center font-pretendard text-size-2 text-gray-600">
            지도 불러오는 중…
          </div>
        ) : (
          <CourseKakaoMap
            bakeries={bakeries}
            departurePoint={departurePoint}
            routePath={routePath}
            routeLoading={routeLoading}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="mt-x3 flex flex-col gap-x2">
        <button
          type="button"
          onClick={onDetailClick}
          className="flex h-[47px] w-full items-center justify-center rounded-r3 bg-orange-600 font-pretendard text-size-3 font-bold leading-t4 text-gray-00 shadow-[0_4px_12px_rgba(255,134,72,0.28)] transition-colors hover:bg-orange-700"
        >
          코스 상세정보 더보기
        </button>
      </div>
    </div>
  );
}
