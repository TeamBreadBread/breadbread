import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, Button } from "@/components/common";
import CourseKakaoMap from "@/components/domain/ai-course/CourseKakaoMap";
import ActiveTourConflictDialog from "@/components/common/dialog/ActiveTourConflictDialog";
import { MobileFrame } from "@/components/layout";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { getCourseDetail, type CourseDetail } from "@/api/courses";
import { resolveAiCourseDeparturePoint } from "@/lib/aiCourseDepartureCoords";
import type { CourseGuidePreviewReturnFrom } from "@/lib/courseGuidePreviewNavigation";
import {
  COURSE_TRANSPORT_OPTIONS,
  saveCourseTransportMode,
  type CourseTransportMode,
} from "@/lib/courseTransportMode";
import { startCourseTourGuide } from "@/lib/startCourseTourGuide";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { useCourseMapPoints } from "@/hooks/useCourseMapPoints";
import { useCourseRoutePath } from "@/hooks/useCourseRoutePath";
import { cn } from "@/utils/cn";

type CourseGuidePreviewPageProps = {
  courseId: number;
  transportMode: CourseTransportMode;
  returnFrom?: CourseGuidePreviewReturnFrom;
};

export default function CourseGuidePreviewPage({
  courseId,
  transportMode,
  returnFrom,
}: CourseGuidePreviewPageProps) {
  const navigate = useNavigate();
  const { startCourseGuide } = useLoginRequired();
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [starting, setStarting] = useState(false);
  const [activeTourConflictOpen, setActiveTourConflictOpen] = useState(false);

  useEffect(() => {
    void saveCourseTransportMode(courseId, transportMode);
  }, [courseId, transportMode]);

  useEffect(() => {
    let cancelled = false;
    setLoadingDetail(true);
    void getCourseDetail(courseId)
      .then((detail) => {
        if (!cancelled) setCourseDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setCourseDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const { mapPoints, resolving: mapPointsResolving } = useCourseMapPoints(courseDetail?.bakeries);
  const { routePath, routeLoading, expectRoutePath } = useCourseRoutePath(courseId);

  const departurePoint = useMemo(
    () =>
      resolveAiCourseDeparturePoint({
        courseId,
        departureLatitude: courseDetail?.departureLatitude,
        departureLongitude: courseDetail?.departureLongitude,
      }),
    [courseDetail?.departureLatitude, courseDetail?.departureLongitude, courseId],
  );

  const transportLabel =
    COURSE_TRANSPORT_OPTIONS.find((option) => option.mode === transportMode)?.label ?? "이동 경로";

  const mapLoading = loadingDetail || mapPointsResolving;

  const handleBack = () => {
    if (returnFrom === "chatbot") {
      window.history.back();
      return;
    }
    if (returnFrom === "route") {
      void navigate({ to: "/ai-search-result", search: { courseId, from: "route" } });
      return;
    }
    if (returnFrom === "home") {
      void navigate({ to: "/home" });
      return;
    }
    void navigate({ to: "/ai-search-result", search: { courseId } });
  };

  const handleStartGuide = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const result = await startCourseTourGuide({
        courseId,
        startCourseGuide,
        saveRouteFocus: returnFrom === "route",
      });
      if (result.ok) {
        void navigate({ to: "/tour", search: { courseId } });
        return;
      }
      if (result.reason === "conflict") {
        setActiveTourConflictOpen(true);
        return;
      }
      window.alert("코스 안내를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <MobileFrame className="relative flex h-screen flex-col overflow-hidden bg-white">
      <AppTopBar title={`${transportLabel} 경로`} onBack={handleBack} />

      <div className="relative min-h-0 flex-1 bg-gray-100">
        <CourseKakaoMap
          key={`${courseId}-${transportMode}`}
          bakeries={mapPoints}
          departurePoint={departurePoint}
          className="h-full w-full"
          isLoading={mapLoading}
          routePath={routePath}
          routeLoading={routeLoading}
          expectRoutePath={expectRoutePath}
          boundsPadding={{ top: 72, right: 40, bottom: 120, left: 40 }}
        />

        {!mapLoading && courseDetail ? (
          <div className="pointer-events-none absolute inset-x-0 top-x4 flex justify-center px-x4">
            <div className="max-w-[calc(100%-32px)] rounded-r3 border border-gray-300 bg-white/95 px-x4 py-x2 shadow-2 backdrop-blur-sm">
              <p className="line-clamp-1 text-center font-pretendard text-size-3 font-semibold leading-t4 text-gray-1000">
                {courseDetail.name}
              </p>
              <p className="mt-x0-5 text-center font-pretendard text-size-2 leading-t3 text-gray-700">
                경로를 확인한 뒤 코스 안내를 시작해 주세요
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-gray-300 bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-x3",
          RESPONSIVE_FRAME_WIDTH,
        )}
      >
        <div className="flex gap-x2">
          <Button
            variant="primary"
            type="button"
            className="flex-[1.4]"
            disabled={starting || mapLoading}
            onClick={() => void handleStartGuide()}
          >
            {starting ? "시작 중…" : "코스 안내 시작"}
          </Button>
          <Button variant="secondary" type="button" className="flex-1" onClick={handleBack}>
            취소
          </Button>
        </div>
      </div>

      <ActiveTourConflictDialog
        open={activeTourConflictOpen}
        onConfirm={() => setActiveTourConflictOpen(false)}
      />
    </MobileFrame>
  );
}
