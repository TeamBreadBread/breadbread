import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import HorizontalScrollArea from "@/components/common/HorizontalScrollArea";
import Skeleton from "@/components/common/skeleton/Skeleton";
import SectionHeader from "@/components/common/section-header/SectionHeader";
import TrendingBakeryCard from "@/components/domain/trend/TrendingBakeryCard";
import { useTrendCuration } from "@/hooks/trend/useTrendCuration";
import { useBakeriesSummary } from "@/hooks/useBakeriesSummary";
import { CURATION_BAKERY_LIST_PARAMS } from "@/components/domain/home/curationBakeryContentParams";
import { buildTrendCurationTitle, hasTrendBakeryId } from "@/utils/trendCuration";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import { buildBbakeryDetailSearch } from "@/utils/bakeryListEntry";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";

const DISPLAY_COUNT = 5;

type TrendCurationSectionProps = {
  title?: string;
  compact?: boolean;
  bakeryListEntryFrom: BakeryListEntryFrom;
  randomTopKeywordCount?: number;
  onMoreClick?: () => void;
  onDisplayedBakeryIdsChange?: (ids: number[]) => void;
  className?: string;
};

export default function TrendCurationSection({
  title = "요즘 뜨는 빵",
  compact = false,
  bakeryListEntryFrom,
  randomTopKeywordCount,
  onMoreClick,
  onDisplayedBakeryIdsChange,
  className,
}: TrendCurationSectionProps) {
  const navigate = useNavigate();
  const { viewModel, loading, error } = useTrendCuration({ randomTopKeywordCount });

  const summaryQuery = useBakeriesSummary(
    { ...CURATION_BAKERY_LIST_PARAMS, page: 0, size: 50 },
    { enabled: Boolean(viewModel?.bakeries.length) },
  );

  const summaryById = useMemo(
    () => new Map((summaryQuery.data?.bakeries ?? []).map((bakery) => [bakery.id, bakery])),
    [summaryQuery.data?.bakeries],
  );

  const visibleBakeries = useMemo(
    () => (viewModel?.bakeries ?? []).slice(0, DISPLAY_COUNT),
    [viewModel?.bakeries],
  );

  const visibleBakeryIds = useMemo(
    () => visibleBakeries.filter(hasTrendBakeryId).map((bakery) => bakery.bakeryId),
    [visibleBakeries],
  );

  const displayedIdsKey = visibleBakeryIds.join(",");
  const onDisplayedChangeRef = useRef(onDisplayedBakeryIdsChange);
  useEffect(() => {
    onDisplayedChangeRef.current = onDisplayedBakeryIdsChange;
  });
  useEffect(() => {
    onDisplayedChangeRef.current?.(visibleBakeryIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedIdsKey]);

  const sectionTitle = viewModel
    ? buildTrendCurationTitle(viewModel.selectedKeyword, viewModel.totalCount)
    : title;

  const handleBakeryClick = (bakeryId: number | null | undefined) => {
    if (typeof bakeryId !== "number" || bakeryId <= 0) return;
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: buildBbakeryDetailSearch({
        bakeryId,
        from: bakeryListEntryFrom,
      }),
    });
  };

  const cardSkeletonClass = compact
    ? "h-[152px] w-[160px] flex-shrink-0 rounded-[var(--radius-r3)]"
    : "h-[200px] w-[220px] flex-shrink-0 rounded-[var(--radius-r3)]";

  return (
    <section
      className={cn(
        "w-full bg-white",
        compact ? "px-[20px] py-[18px]" : "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
        !compact && APP_SHELL_MAX_WIDTH,
        className,
      )}
    >
      <div className="flex flex-col gap-[12px]">
        <SectionHeader
          title={loading ? title : sectionTitle}
          titleClassName={compact ? "typo-t6bold text-gray-1000" : "font-sans typo-t6bold"}
          actionLabel="더보기"
          onActionClick={onMoreClick ?? (() => {})}
          showDefaultIcon={false}
        />

        {loading ? (
          <HorizontalScrollArea aria-label="트렌드 빵집 로딩">
            <div className="flex w-max gap-[var(--spacing-x4)]">
              {Array.from({ length: DISPLAY_COUNT }).map((_, index) => (
                <Skeleton key={index} className={cardSkeletonClass} />
              ))}
            </div>
          </HorizontalScrollArea>
        ) : error || !viewModel ? (
          <div className="flex min-h-[152px] w-full items-center justify-center rounded-[var(--radius-r3)] bg-[var(--color-gray-200)] px-4 text-center text-[length:var(--font-size-3)] text-[var(--color-gray-600)]">
            {error ? "인기 빵 정보를 불러오지 못했어요" : "표시할 인기 빵 맛집이 없어요"}
          </div>
        ) : (
          <HorizontalScrollArea aria-label="트렌드 빵집 목록">
            <div className="flex w-max gap-[var(--spacing-x4)]">
              {visibleBakeries.map((bakery, index) => {
                const bakeryId = bakery.bakeryId;
                const thumbnail =
                  typeof bakeryId === "number" ? summaryById.get(bakeryId)?.thumbnailUrl : null;

                return (
                  <TrendingBakeryCard
                    key={`${bakery.keyword}-${bakeryId ?? bakery.bakeryName ?? index}`}
                    bakery={bakery}
                    imageUrl={thumbnail}
                    compact={compact}
                    onClick={
                      typeof bakeryId === "number" && bakeryId > 0
                        ? () => handleBakeryClick(bakeryId)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </HorizontalScrollArea>
        )}
      </div>
    </section>
  );
}
