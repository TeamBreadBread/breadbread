import { AppTopBar, Button } from "@/components/common";
import { AppIcon, IconAssets } from "@/components/icons";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MobileFrame } from "@/components/layout";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";
import CourseTimeline from "@/components/domain/ai-course/CourseTimeline";
import ResultSummaryCard from "@/components/domain/ai-course/ResultSummaryCard";
import type { CoursePlace, CourseSummary } from "@/components/domain/ai-course/types";
import { getDevFallbackCourseId } from "@/lib/courseIdFallback";
import { formatCourseEstimatedTime } from "@/utils/formatCourseEstimatedTime";
import { resolveAiCourseDeparturePoint } from "@/lib/aiCourseDepartureCoords";
import CourseKakaoMap from "@/components/domain/ai-course/CourseKakaoMap";
import { useCourseMapPoints } from "@/hooks/useCourseMapPoints";
import handleArrow from "@/assets/icons/handle_arrowup.png";
import { useAiSearchBottomSheet } from "@/hooks/useAiSearchBottomSheet";
import {
  getCourseDetail,
  getMyCourseRoutes,
  reorderCourseBakeries,
  saveCourseRoute,
  type CourseDetail,
} from "@/api/courses";
import { getBakeriesCongestion, getBakeryById } from "@/api/bakery";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";
import { startTour } from "@/api/tours";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { mapCongestionByBakeryId } from "@/utils/congestionCheck";
import { AI_COURSE_RESULT_STORAGE_KEY, saveRouteFocusCourseId } from "@/utils/aiCourseStorage";
import { buildBbakeryDetailSearch } from "@/utils/bakeryListEntry";
import ResultCTASection from "@/components/domain/ai-course/ResultCTASection";
import SaveRouteBanner from "@/components/domain/ai-course/SaveRouteBanner";
import ActiveTourConflictDialog from "@/components/common/dialog/ActiveTourConflictDialog";
import { hasConflictingActiveTour } from "@/utils/activeTourGuard";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";
import { resetAiCourseFlowForRetry } from "@/utils/clearAiCourseJobContext";
import { findMatchingSavedRoute, isSameCourseRouteContent } from "@/utils/courseRouteCompare";
import { useCourseGuideStart } from "@/hooks/useCourseGuideStart";
import { formatBakerySignatureMenuLabel } from "@/utils/bakerySignatureMenu";
import {
  trackAiCourseRegenerated,
  trackRouteDetailViewed,
  trackTourStarted,
} from "@/lib/analytics/gtag";

const summary: CourseSummary = {
  title: "커플을 위한 달콤한 빵투어",
  duration: "3~4시간",
  price: "3만원",
};

const devRecommendReason =
  "커플이 함께 걸으며 즐기기 좋은 달콤한 빵 위주로, 이동 동선을 최소화해 구성했어요.";

const places: CoursePlace[] = [
  {
    id: "1",
    name: "성심당 본점",
    address: "대전 중구 대종로480번길 15",
    recommendReason: "대표 메뉴와 전통 베이커리 분위기를 함께 즐길 수 있어요",
    menu: "소보로, 튀김소보로",
    congestionLevel: "HIGH",
  },
  {
    id: "2",
    name: "몽심 대흥점",
    address: "대전 중구 중교로 32 1층",
    recommendReason: "바삭한 크루아상과 스콘이 인기 있는 동네 베이커리예요",
    menu: "크루아상, 스콘",
    congestionLevel: "MEDIUM",
  },
  {
    id: "3",
    name: "땡큐베리머치",
    address: "대전 중구 중교로 49",
    recommendReason: "케이크와 마카롱으로 달콤한 디저트 타임을 보내기 좋아요",
    menu: "케이크, 마카롱",
    congestionLevel: "LOW",
  },
  {
    id: "4",
    name: "뮤제 베이커리",
    address: "대전 중구 대흥로121번길 44",
    recommendReason: "감성적인 공간에서 마들렌과 샌드위치를 즐길 수 있어요",
    menu: "마들렌, 샌드위치",
    congestionLevel: "MEDIUM",
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
      const parsed = JSON.parse(raw) as CourseDetail;
      if (effectiveCourseId && parsed.id !== effectiveCourseId) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [effectiveCourseId]);

  const [apiCourseDetail, setApiCourseDetail] = useState<{
    courseId: number;
    detail: CourseDetail;
  } | null>(null);
  const [reorderBusy, setReorderBusy] = useState(false);
  const [congestionByBakeryId, setCongestionByBakeryId] = useState<
    Map<number, { level?: string | null; expectedWaitMin?: number | null }>
  >(new Map());
  const [signatureMenuByBakeryId, setSignatureMenuByBakeryId] = useState<Map<number, string>>(
    new Map(),
  );

  // courseId가 있으면 항상 API로 최신 코스 상세를 조회한다.
  useEffect(() => {
    if (!effectiveCourseId) return undefined;

    let cancelled = false;

    void getCourseDetail(effectiveCourseId)
      .then((detail) => {
        if (cancelled) return;
        setApiCourseDetail({ courseId: effectiveCourseId, detail });
        try {
          sessionStorage.setItem(AI_COURSE_RESULT_STORAGE_KEY, JSON.stringify(detail));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* 조회 실패 시 sessionStorage/하드코딩 폴백 사용 */
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveCourseId]);

  useEffect(() => {
    if (from !== "route" || !effectiveCourseId) return;
    trackRouteDetailViewed(effectiveCourseId);
  }, [from, effectiveCourseId]);

  const courseDetail: CourseDetail | null = useMemo(() => {
    if (apiCourseDetail?.courseId === effectiveCourseId) return apiCourseDetail.detail;
    if (storedCourseDetail?.id === effectiveCourseId) return storedCourseDetail;
    return null;
  }, [storedCourseDetail, apiCourseDetail, effectiveCourseId]);

  const courseDetailLoading =
    effectiveCourseId != null &&
    apiCourseDetail?.courseId !== effectiveCourseId &&
    storedCourseDetail?.id !== effectiveCourseId;

  useEffect(() => {
    const bakeryIds =
      courseDetail?.bakeries?.map((bakery) => bakery.id).filter((id) => id > 0) ?? [];
    if (bakeryIds.length === 0) {
      setCongestionByBakeryId(new Map());
      return;
    }

    let cancelled = false;
    void getBakeriesCongestion(bakeryIds)
      .then((items) => {
        if (cancelled) return;
        const mapped = mapCongestionByBakeryId(items);
        setCongestionByBakeryId(
          new Map(
            [...mapped.entries()].map(([id, item]) => [
              id,
              { level: item.level, expectedWaitMin: item.expectedWaitMin },
            ]),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setCongestionByBakeryId(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, [courseDetail]);

  useEffect(() => {
    const bakeryIds =
      courseDetail?.bakeries
        ?.filter((bakery) => !bakery.recommendedBread?.trim())
        .map((bakery) => bakery.id)
        .filter((id) => id > 0) ?? [];
    if (bakeryIds.length === 0) {
      setSignatureMenuByBakeryId(new Map());
      return;
    }

    let cancelled = false;
    setSignatureMenuByBakeryId(new Map());

    void Promise.all(
      bakeryIds.map(async (bakeryId) => {
        try {
          const detail = await getBakeryById(bakeryId);
          const label = formatBakerySignatureMenuLabel(detail.breads ?? []);
          return [bakeryId, label] as const;
        } catch {
          return [bakeryId, ""] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setSignatureMenuByBakeryId(new Map(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [courseDetail]);

  const dynamicSummary: CourseSummary | null = useMemo(() => {
    if (!courseDetail) return null;
    const costLabel =
      Number.isFinite(courseDetail.estimatedCost) && courseDetail.estimatedCost > 0
        ? `${courseDetail.estimatedCost.toLocaleString("ko-KR")}원`
        : summary.price;
    return {
      title: courseDetail.name || summary.title,
      duration: formatCourseEstimatedTime(courseDetail.estimatedTime) || summary.duration,
      price: costLabel,
    };
  }, [courseDetail]);

  const dynamicPlaces: CoursePlace[] | null = useMemo(() => {
    if (!courseDetail) return null;
    if (!Array.isArray(courseDetail.bakeries)) return null;
    return courseDetail.bakeries.map((bakery, index) => {
      const congestion = congestionByBakeryId.get(bakery.id);
      const signatureMenu = signatureMenuByBakeryId.get(bakery.id)?.trim() ?? "";
      const recommendedBread = bakery.recommendedBread?.trim() ?? "";
      return {
        id: String(bakery.id ?? index + 1),
        name: bakery.name || `빵집 ${index + 1}`,
        address: bakery.address || "",
        recommendReason: bakery.reason?.trim() ?? "",
        menu: recommendedBread || signatureMenu,
        congestionLevel: congestion?.level,
        expectedWaitMin: congestion?.expectedWaitMin,
      };
    });
  }, [courseDetail, congestionByBakeryId, signatureMenuByBakeryId]);

  const { mapPoints: mapBakeries, resolving: mapPointsResolving } = useCourseMapPoints(
    courseDetail?.bakeries,
  );

  const mapLoading = (courseDetailLoading && !courseDetail) || mapPointsResolving;
  const useDevFallbackContent = !effectiveCourseId;
  const displaySummary = dynamicSummary ?? (useDevFallbackContent ? summary : null);
  const displayPlaces = dynamicPlaces ?? (useDevFallbackContent ? places : null);
  const courseIconSeed = effectiveCourseId ?? displaySummary?.title ?? summary.title;
  const displayRecommendReason =
    courseDetail?.recommendReason?.trim() || (useDevFallbackContent ? devRecommendReason : null);

  const departurePoint = useMemo(
    () =>
      resolveAiCourseDeparturePoint({
        courseId: effectiveCourseId,
        departureLatitude: courseDetail?.departureLatitude,
        departureLongitude: courseDetail?.departureLongitude,
        allowLatestFallback: !effectiveCourseId,
      }),
    [effectiveCourseId, courseDetail?.departureLatitude, courseDetail?.departureLongitude],
  );

  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [activeTourConflictOpen, setActiveTourConflictOpen] = useState(false);

  const { sheetRef, contentRef, liveSheetTopY, isDragging, isHalfSheet, togglePhase } =
    useAiSearchBottomSheet();

  const mapHeightPx = useMemo(() => Math.max(160, Math.round(liveSheetTopY)), [liveSheetTopY]);

  const resolvedSummary =
    displaySummary ??
    (effectiveCourseId ? { title: "코스 불러오는 중…", duration: "—", price: "—" } : summary);

  const handleCourseGuide = async () => {
    if (!effectiveCourseId) {
      window.alert("안내할 코스 정보를 찾지 못했습니다.");
      return;
    }
    if (await hasConflictingActiveTour(effectiveCourseId)) {
      setActiveTourConflictOpen(true);
      return;
    }
    if (from === "route") {
      saveRouteFocusCourseId(effectiveCourseId);
    }
    trackTourStarted(effectiveCourseId);
    startCourseGuide(effectiveCourseId);
    try {
      await startTour(effectiveCourseId);
    } catch {
      /* 이미 진행 중(409)이면 투어 화면에서 복구 */
    }
    void navigate({ to: "/tour", search: { courseId: effectiveCourseId } });
  };

  const { requestCourseGuideStart, closedBakeryDialog } = useCourseGuideStart({
    courseId: effectiveCourseId,
    onCourseUpdated: (detail) => {
      if (!effectiveCourseId) return;
      setApiCourseDetail({ courseId: effectiveCourseId, detail });
      try {
        sessionStorage.setItem(AI_COURSE_RESULT_STORAGE_KEY, JSON.stringify(detail));
      } catch {
        /* ignore */
      }
    },
    onStartGuide: handleCourseGuide,
  });

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
      search: buildBbakeryDetailSearch({
        bakeryId,
        from: "ai-result",
        courseId: effectiveCourseId ?? undefined,
      }),
    });
  };

  const handleSaveCourse = () => {
    requireLogin(async () => {
      if (!effectiveCourseId || !courseDetail) return;

      try {
        const savedRoutes = await getMyCourseRoutes();

        // 같은 courseId가 이미 저장됨 (생성 직후 자동 저장 포함)
        if (savedRoutes.some((route) => route.courseId === effectiveCourseId)) {
          setShowSavedBanner(true);
          return;
        }

        const sameNameRoute = savedRoutes.find(
          (route) =>
            route.name.trim() === (courseDetail.name?.trim() ?? "") && route.name.trim() !== "",
        );

        // 이름만 같고 빵집 구성이 다르면 별도 코스로 저장
        if (sameNameRoute && !isSameCourseRouteContent(courseDetail, sameNameRoute)) {
          await saveCourseRoute(effectiveCourseId);
          setShowSavedBanner(true);
          return;
        }

        // 이름·빵집 구성까지 동일한 코스가 이미 있으면 저장 성공으로 처리
        const equivalentRoute = findMatchingSavedRoute(savedRoutes, courseDetail);
        if (equivalentRoute) {
          setShowSavedBanner(true);
          return;
        }

        await saveCourseRoute(effectiveCourseId);
        setShowSavedBanner(true);
      } catch (error) {
        // 동일 courseId 재저장(409)은 팝업 대신 저장 완료 배너
        if (error instanceof ApiBusinessError && (error.code === "E0408" || error.status === 409)) {
          setShowSavedBanner(true);
          return;
        }
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

  const handleGoToRouteList = () => {
    setShowSavedBanner(false);
    void navigate({ to: "/route" });
  };

  const handleRetryRecommendation = () => {
    trackAiCourseRegenerated();
    requireLogin(() => {
      resetAiCourseFlowForRetry();
      void navigate({ to: AI_COURSE_FLOW_START, replace: true });
    }, "/preference");
  };

  const refreshCourseDetail = async (courseId: number) => {
    const detail = await getCourseDetail(courseId);
    setApiCourseDetail({ courseId, detail });
    try {
      sessionStorage.setItem(AI_COURSE_RESULT_STORAGE_KEY, JSON.stringify(detail));
    } catch {
      /* ignore */
    }
  };

  const handleReorderBakeries = (nextPlaces: CoursePlace[]) => {
    if (!effectiveCourseId || !courseDetail?.bakeries?.length || reorderBusy) return;

    const bakeryById = new Map(courseDetail.bakeries.map((bakery) => [bakery.id, bakery]));
    const nextBakeries = nextPlaces
      .map((place) => bakeryById.get(Number.parseInt(place.id, 10)))
      .filter((bakery): bakery is NonNullable<typeof bakery> => bakery != null);

    if (nextBakeries.length !== courseDetail.bakeries.length) return;

    const nextOrder = nextBakeries.map((bakery) => bakery.id);

    setApiCourseDetail({
      courseId: effectiveCourseId,
      detail: { ...courseDetail, bakeries: nextBakeries },
    });
    setReorderBusy(true);
    void (async () => {
      try {
        await reorderCourseBakeries(effectiveCourseId, { bakeryOrder: nextOrder });
        await refreshCourseDetail(effectiveCourseId);
      } catch (error) {
        await refreshCourseDetail(effectiveCourseId).catch(() => {
          /* 서버 복구 실패 시 아래 alert만 표시 */
        });
        window.alert(getErrorMessage(error));
      } finally {
        setReorderBusy(false);
      }
    })();
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
          key={effectiveCourseId ?? "no-course"}
          bakeries={mapBakeries}
          departurePoint={departurePoint}
          className="h-full w-full"
          isLoading={mapLoading}
          layoutKey={mapHeightPx}
          boundsPadding={{ top: 56, right: 40, bottom: 40, left: 40 }}
        />
      </div>

      <div className="pointer-events-none relative z-10">
        <div className="pointer-events-auto bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]">
          <AppTopBar
            title="AI 추천 코스"
            onBack={() => navigate({ to: from === "route" ? "/route" : "/home" })}
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
          <ResultSummaryCard
            summary={resolvedSummary}
            iconSeed={courseIconSeed}
            recommendReason={displayRecommendReason}
          />
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
          {displayPlaces && displayPlaces.length > 0 ? (
            <CourseTimeline
              places={displayPlaces}
              onPlaceClick={handlePlaceClick}
              canReorder={Boolean(courseDetail?.bakeries && courseDetail.bakeries.length > 1)}
              reorderBusy={reorderBusy}
              onReorderPlaces={handleReorderBakeries}
            />
          ) : courseDetailLoading ? (
            <p className="px-x5 py-x8 text-center font-pretendard text-size-4 text-gray-500">
              코스 불러오는 중…
            </p>
          ) : null}
        </div>
      </aside>

      {from === "route" ? null : (
        <ResultCTASection onRetry={handleRetryRecommendation} onSave={handleSaveCourse} />
      )}
      {showSavedBanner && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-[110] w-full max-w-[402px] -translate-x-1/2">
              <SaveRouteBanner onActionClick={handleGoToRouteList} />
            </div>,
            document.body,
          )
        : null}

      <ActiveTourConflictDialog
        open={activeTourConflictOpen}
        onConfirm={() => setActiveTourConflictOpen(false)}
      />
      {closedBakeryDialog}

      {from === "route" ? (
        <div
          className={cn(
            "fixed bottom-0 left-1/2 z-30 -translate-x-1/2 border-t border-gray-300 bg-white px-[20px] pb-[max(16px,env(safe-area-inset-bottom))] pt-x3",
            RESPONSIVE_FRAME_WIDTH,
          )}
        >
          <div className="flex gap-x2">
            <Button
              variant="primary"
              type="button"
              className="flex-1"
              onClick={() => void requestCourseGuideStart()}
            >
              코스 안내
            </Button>
            <Button
              variant="secondary"
              type="button"
              className="flex-1"
              onClick={goBreadTaxiReserve}
            >
              예약하기
            </Button>
          </div>
        </div>
      ) : null}
    </MobileFrame>
  );
}
