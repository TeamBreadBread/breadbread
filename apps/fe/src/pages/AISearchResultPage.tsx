import { AppTopBar, Button } from "@/components/common";
import { AppIcon, IconAssets } from "@/components/icons";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileFrame } from "@/components/layout";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";
import CourseTimeline from "@/components/domain/ai-course/CourseTimeline";
import ResultSummaryCard from "@/components/domain/ai-course/ResultSummaryCard";
import type { CoursePlace, CourseSummary } from "@/components/domain/ai-course/types";
import { getDevFallbackCourseId } from "@/lib/courseIdFallback";
import { pickCourseBreadIcon } from "@/lib/courseBreadIcons";
import { getLatestAiCourseDepartureCoords } from "@/lib/aiCourseDepartureCoords";
import CourseKakaoMap from "@/components/domain/ai-course/CourseKakaoMap";
import { courseBakeriesToMapPoints } from "@/components/domain/ai-course/courseMapPoints";
import handleArrow from "@/assets/icons/handle_arrowup.png";
import { useAiSearchBottomSheet } from "@/hooks/useAiSearchBottomSheet";
import { AI_COURSE_RESULT_STORAGE_KEY } from "@/utils/aiCourseStorage";
import { getCourseDetail, saveCourseRoute, type CourseDetail } from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { startTour } from "@/api/tours";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import ResultCTASection from "@/components/domain/ai-course/ResultCTASection";
import SaveRouteBanner from "@/components/domain/ai-course/SaveRouteBanner";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";

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

type AISearchResultPageProps = {
  courseId: number | null;
  /** 진입 경로. "route"(내 루트 목록)로 들어온 경우에만 빵택시 예약 노출 */
  from?: "route";
};

export default function AISearchResultPage({ courseId, from }: AISearchResultPageProps) {
  const navigate = useNavigate();
  const { requireLogin, startCourseGuide } = useLoginRequired();
  const effectiveCourseId = courseId ?? getDevFallbackCourseId();
  const storedCourseDetail = useMemo((): CourseDetail | null => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(AI_COURSE_RESULT_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CourseDetail;
    } catch {
      return null;
    }
  }, []);

  const [apiCourseDetail, setApiCourseDetail] = useState<{
    courseId: number;
    detail: CourseDetail;
  } | null>(null);

  // 루트 목록 등 sessionStorage에 코스 정보가 없는 경로로 진입한 경우 courseId로 직접 조회
  useEffect(() => {
    if (!effectiveCourseId) return undefined;
    if (storedCourseDetail?.id === effectiveCourseId) return undefined;

    let cancelled = false;
    void getCourseDetail(effectiveCourseId)
      .then((detail) => {
        if (!cancelled) setApiCourseDetail({ courseId: effectiveCourseId, detail });
      })
      .catch(() => {
        /* 조회 실패 시 sessionStorage/하드코딩 폴백 사용 */
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveCourseId, storedCourseDetail]);

  const courseDetail: CourseDetail | null = useMemo(() => {
    if (storedCourseDetail?.id === effectiveCourseId) return storedCourseDetail;
    if (apiCourseDetail?.courseId === effectiveCourseId) return apiCourseDetail.detail;
    return storedCourseDetail;
  }, [storedCourseDetail, apiCourseDetail, effectiveCourseId]);

  const dynamicSummary: CourseSummary | null = useMemo(() => {
    if (!courseDetail) return null;
    const costLabel =
      Number.isFinite(courseDetail.estimatedCost) && courseDetail.estimatedCost > 0
        ? `${courseDetail.estimatedCost.toLocaleString("ko-KR")}원`
        : summary.price;
    return {
      title: courseDetail.name || summary.title,
      duration: courseDetail.estimatedTime || summary.duration,
      price: costLabel,
    };
  }, [courseDetail]);

  const mapBakeries = useMemo(() => {
    if (!courseDetail?.bakeries?.length) return [];
    return courseBakeriesToMapPoints(courseDetail.bakeries);
  }, [courseDetail]);

  const courseIconSrc = useMemo(
    () => pickCourseBreadIcon(effectiveCourseId ?? dynamicSummary?.title ?? summary.title),
    [effectiveCourseId, dynamicSummary?.title],
  );

  const departurePoint = useMemo(() => {
    const departure = getLatestAiCourseDepartureCoords();
    if (!departure) return null;
    return {
      lat: departure.latitude,
      lng: departure.longitude,
      label: departure.markerLabel?.trim() || "출발지",
    };
  }, []);

  // 출발지 좌표가 없으면 출발지 마커 없이 빵집들만 직선으로 연결한다.
  const visibleDeparturePoint = departurePoint;

  const dynamicPlaces: CoursePlace[] | null = useMemo(() => {
    if (!courseDetail) return null;
    if (!Array.isArray(courseDetail.bakeries)) return null;
    return courseDetail.bakeries.map((bakery, index) => {
      return {
        id: String(bakery.id ?? index + 1),
        name: bakery.name || `빵집 ${index + 1}`,
        address: bakery.address || "",
        menu: Number.isFinite(bakery.rating) ? `평점 ${bakery.rating}` : "빵집 정보",
      };
    });
  }, [courseDetail]);

  const [showSavedBanner, setShowSavedBanner] = useState(false);

  const { sheetRef, contentRef, liveSheetTopY, isDragging, isHalfSheet, togglePhase } =
    useAiSearchBottomSheet();

  const mapHeightPx = useMemo(() => Math.max(160, Math.round(liveSheetTopY)), [liveSheetTopY]);

  const handleCourseGuide = async () => {
    if (!effectiveCourseId) {
      window.alert("안내할 코스 정보를 찾지 못했습니다.");
      return;
    }
    startCourseGuide(effectiveCourseId);
    try {
      await startTour(effectiveCourseId);
    } catch {
      /* 이미 진행 중(409)이면 투어 화면에서 복구 */
    }
    void navigate({ to: "/tour", search: { courseId: effectiveCourseId } });
  };

  const goBreadTaxiReserve = () => {
    if (!effectiveCourseId) {
      window.alert(
        "예약 가능한 코스 정보를 찾지 못했습니다. 개발 환경에서는 VITE_DEV_FALLBACK_COURSE_ID를 설정해 주세요.",
      );
      return;
    }
    navigate({ to: "/taxi-reserve", search: { courseId: effectiveCourseId } });
  };

  const handlePlaceClick = (place: CoursePlace) => {
    const bakeryId = Number.parseInt(place.id, 10);
    if (!Number.isFinite(bakeryId) || bakeryId <= 0) return;
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: {
        bakeryId,
        from: "ai-result",
        courseId: effectiveCourseId ?? undefined,
        reviewUploaded: undefined,
        reviewTab: undefined,
      },
    });
  };

  const handleSaveCourse = () => {
    requireLogin(async () => {
      if (!effectiveCourseId) return;
      try {
        await saveCourseRoute(effectiveCourseId);
        setShowSavedBanner(true);
      } catch (error) {
        window.alert(getErrorMessage(error));
      }
    }, "/ai-search-result");
  };

  useEffect(() => {
    if (!showSavedBanner) return;
    const timer = window.setTimeout(() => {
      setShowSavedBanner(false);
    }, 2000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [showSavedBanner]);

  const handleRetryRecommendation = () => {
    requireLogin(() => {
      void navigate({ to: AI_COURSE_FLOW_START });
    }, "/preference");
  };

  return (
    <MobileFrame className="relative h-screen overflow-hidden bg-white">
      {/* 네이버 지도처럼: 바텀시트 top까지 지도가 꽉 참 */}
      <div
        className="absolute inset-x-0 top-0 z-[1] overflow-hidden bg-gray-100"
        style={{
          height: mapHeightPx,
          transition: isDragging ? "none" : "height 300ms ease-out",
        }}
        aria-hidden={false}
      >
        <CourseKakaoMap
          bakeries={mapBakeries}
          departurePoint={visibleDeparturePoint}
          pathMode="simple"
          courseSeed={effectiveCourseId ?? summary.title}
          className="h-full w-full"
        />
      </div>

      <div className="pointer-events-none relative z-10">
        <div className="pointer-events-auto bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
          <AppTopBar
            title="AI 추천 코스"
            onBack={() => navigate({ to: "/home" })}
            rightAction={
              <button
                type="button"
                aria-label="더보기"
                className="flex items-center justify-center"
              >
                <AppIcon src={IconAssets.IcKebab} size={24} alt="" />
              </button>
            }
          />
          <ResultSummaryCard summary={dynamicSummary ?? summary} iconSrc={courseIconSrc} />
        </div>
      </div>

      <aside
        ref={sheetRef}
        className={cn(
          "absolute inset-x-0 z-20 overflow-hidden rounded-t-r5 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]",
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
            "pb-[calc(160px+env(safe-area-inset-bottom))]",
          )}
        >
          <CourseTimeline places={dynamicPlaces ?? places} onPlaceClick={handlePlaceClick} />
        </div>
      </aside>

      {from === "route" ? null : (
        <ResultCTASection onRetry={handleRetryRecommendation} onSave={handleSaveCourse} />
      )}
      {showSavedBanner ? (
        <div
          className={cn(
            "fixed bottom-[calc(160px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full -translate-x-1/2",
            RESPONSIVE_FRAME_WIDTH,
          )}
        >
          <SaveRouteBanner />
        </div>
      ) : null}

      {from === "route" ? (
        <div
          className={cn(
            "fixed bottom-0 left-1/2 z-30 -translate-x-1/2 border-t border-gray-300 bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-x3",
            RESPONSIVE_FRAME_WIDTH,
          )}
        >
          <div className="flex flex-col gap-x2">
            <Button
              variant="primary"
              fullWidth
              type="button"
              onClick={() => void handleCourseGuide()}
            >
              코스 안내하기
            </Button>
            <Button variant="secondary" fullWidth type="button" onClick={goBreadTaxiReserve}>
              빵택시 예약
            </Button>
          </div>
        </div>
      ) : null}
    </MobileFrame>
  );
}
