import { useEffect, useMemo, useRef, useState } from "react";
import type { BakeryListItem, BakerySummaryItem, GetBakeriesParams } from "@/api/types/bakery";
import { useNavigate } from "@tanstack/react-router";
import Skeleton from "@/components/common/skeleton/Skeleton";
import { useBakeries } from "@/hooks/useBakeries";
import { useBakeriesSummary } from "@/hooks/useBakeriesSummary";
import { resolveCurationCardAddress } from "@/utils/formatCurationAddress";
import { getSafeImageUrl } from "@/utils/safeImageUrl";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import {
  CURATION_BAKERY_LIST_PARAMS,
  CURATION_DISPLAY_COUNT,
  shuffleArray,
} from "./curationBakeryContentParams";
import { DONG_REGION_FALLBACK } from "./dongCurationParams";
import CurationFooter, { type CurationItem } from "./CurationFooter";

type CurationBakeryContentProps = {
  /** 빵터 등 좁은 레이아웃용 축소 카드 */
  compact?: boolean;
  /** 빵집 상세·리스트 뒤로가기 맥락 (홈 큐레이션 vs 빵터 큐레이션) */
  bakeryListEntryFrom: BakeryListEntryFrom;
  /** 미지정 시 `bakeryId`로 빵집 상세로 이동 */
  onCardClick?: (item: CurationItem, index: number) => void;
  /** 현재 카드에 노출된 빵집 id(카드 순서) — 더보기 시 목록 상단 고정에 사용 */
  onDisplayedBakeryIdsChange?: (ids: number[]) => void;
  /** 기본값: 홈과 동일 4장 — 빵터는 6장 등 */
  displayCount?: number;
  /** 기본 목록 파라미터에 덮어쓸 추가 조건 (예: 지역 키워드) */
  listParamsOverride?: Partial<GetBakeriesParams>;
  /** 이미 다른 섹션에서 사용한 빵집 id를 제외 */
  excludeBakeryIds?: number[];
  /** true면 GET /bakeries/summary (동 큐레이션·`dong` 필터 등) */
  useSummary?: boolean;
  /** summary 모드에서 카드 주소에 우선 표시할 행정동 라벨 */
  dongCardLabel?: string;
  /** true면 마운트(새로고침) 후 첫 픽만 사용하고 이후 재섞지 않음 */
  lockSelectionOnMount?: boolean;
  /** lock 사용 시 false면 스켈레톤 유지 (위 큐레이션 id 대기 등) */
  readyToPick?: boolean;
};

function mapListItemToCurationItem(
  b: BakeryListItem,
  addressMaxTokens: number,
  dongCardLabel?: string,
): CurationItem {
  const address = dongCardLabel?.trim() || resolveCurationCardAddress(b.address, addressMaxTokens);
  const rawImage = b.previewImageUrls?.[0]?.trim() || b.thumbnailUrl?.trim() || null;
  return {
    bakeryId: b.id,
    title: b.name,
    address,
    rate: b.rating != null ? Number(b.rating) : 0,
    imageUrl: getSafeImageUrl(rawImage ?? undefined) ?? null,
  };
}

function mapSummaryItemToCurationItem(
  b: BakerySummaryItem,
  addressMaxTokens: number,
  dongCardLabel?: string,
): CurationItem {
  const address = dongCardLabel?.trim() || resolveCurationCardAddress(b.address, addressMaxTokens);
  const rawImage = b.thumbnailUrl?.trim() || null;
  return {
    bakeryId: b.id,
    title: b.name,
    address,
    rate: b.rating != null ? Number(b.rating) : 0,
    imageUrl: getSafeImageUrl(rawImage ?? undefined) ?? null,
  };
}

export function CurationBakeryContent({
  compact,
  bakeryListEntryFrom,
  onCardClick,
  onDisplayedBakeryIdsChange,
  displayCount: displayCountProp,
  listParamsOverride,
  excludeBakeryIds,
  useSummary = false,
  dongCardLabel,
  lockSelectionOnMount = false,
  readyToPick = true,
}: CurationBakeryContentProps) {
  const navigate = useNavigate();
  const [lockedItems, setLockedItems] = useState<CurationItem[] | null>(null);
  const displayCount = displayCountProp ?? CURATION_DISPLAY_COUNT;
  const dongFilter = listParamsOverride?.dong?.trim() ?? "";
  const regionFallback = dongFilter ? DONG_REGION_FALLBACK[dongFilter] : undefined;

  const listParams: GetBakeriesParams = useMemo(() => {
    const requestedSize = listParamsOverride?.size ?? CURATION_BAKERY_LIST_PARAMS.size;
    return {
      ...CURATION_BAKERY_LIST_PARAMS,
      ...listParamsOverride,
      size: Math.max(requestedSize, displayCount),
    };
  }, [displayCount, listParamsOverride]);

  const dongSummaryParams = useMemo(
    () => ({ ...listParams, dong: dongFilter || undefined, region: undefined }),
    [listParams, dongFilter],
  );
  const regionSummaryParams = useMemo(
    () => ({ ...listParams, dong: undefined, region: regionFallback }),
    [listParams, regionFallback],
  );

  const fullQuery = useBakeries(listParams, { enabled: !useSummary });
  const dongSummaryQuery = useBakeriesSummary(dongSummaryParams, {
    enabled: useSummary && Boolean(dongFilter),
  });
  const dongSummaryEmpty =
    useSummary &&
    Boolean(dongFilter) &&
    !dongSummaryQuery.loading &&
    dongSummaryQuery.data != null &&
    dongSummaryQuery.data.bakeries.length === 0;
  const regionSummaryQuery = useBakeriesSummary(regionSummaryParams, {
    enabled: useSummary && dongSummaryEmpty && Boolean(regionFallback),
  });
  const plainSummaryQuery = useBakeriesSummary(listParams, {
    enabled: useSummary && !dongFilter,
  });

  const summaryData =
    dongFilter && dongSummaryQuery.data?.bakeries.length
      ? dongSummaryQuery.data
      : dongSummaryEmpty && regionSummaryQuery.data?.bakeries.length
        ? regionSummaryQuery.data
        : dongFilter
          ? dongSummaryQuery.data
          : plainSummaryQuery.data;

  const summaryLoading =
    (dongFilter && dongSummaryQuery.loading) ||
    (dongSummaryEmpty && regionFallback && regionSummaryQuery.loading) ||
    (!dongFilter && plainSummaryQuery.loading);

  const summaryError =
    dongFilter && regionFallback
      ? (dongSummaryQuery.error ?? (dongSummaryEmpty ? regionSummaryQuery.error : null))
      : dongFilter
        ? dongSummaryQuery.error
        : plainSummaryQuery.error;

  const { data, loading, error } = useSummary
    ? { data: summaryData, loading: summaryLoading, error: summaryError }
    : fullQuery;

  const pickedItems: CurationItem[] = useMemo(() => {
    if (lockSelectionOnMount && !readyToPick) {
      return [];
    }
    if (!data?.bakeries?.length) return [];

    const excluded = new Set(excludeBakeryIds ?? []);
    const filtered = data.bakeries.filter((bakery) => !excluded.has(bakery.id));
    const source = filtered.length > 0 ? filtered : data.bakeries;
    const picked = shuffleArray(source).slice(0, displayCount);
    const addressMaxTokens = compact ? 2 : 4;

    if (useSummary) {
      return (picked as BakerySummaryItem[]).map((b) =>
        mapSummaryItemToCurationItem(b, addressMaxTokens, dongCardLabel),
      );
    }
    return (picked as BakeryListItem[]).map((b) =>
      mapListItemToCurationItem(b, addressMaxTokens, dongCardLabel),
    );
  }, [
    data,
    displayCount,
    excludeBakeryIds,
    compact,
    useSummary,
    dongCardLabel,
    lockSelectionOnMount,
    readyToPick,
  ]);

  // 동·필터가 바뀌면 고정 픽 초기화
  useEffect(() => {
    if (!lockSelectionOnMount) return;
    setLockedItems(null);
  }, [lockSelectionOnMount, dongFilter, regionFallback]);

  // 첫 픽만 state에 고정 (리프레시마다 재섞임 방지)
  useEffect(() => {
    if (!lockSelectionOnMount || !readyToPick || pickedItems.length === 0) return;
    setLockedItems((prev) => prev ?? pickedItems);
  }, [lockSelectionOnMount, readyToPick, pickedItems]);

  const items = lockSelectionOnMount && lockedItems ? lockedItems : pickedItems;

  const displayedBakeryIds = useMemo(
    () =>
      items.map((i) => i.bakeryId).filter((id): id is number => typeof id === "number" && id > 0),
    [items],
  );
  const displayedIdsKey = displayedBakeryIds.join(",");

  const onDisplayedChangeRef = useRef(onDisplayedBakeryIdsChange);
  useEffect(() => {
    onDisplayedChangeRef.current = onDisplayedBakeryIdsChange;
  });

  useEffect(() => {
    onDisplayedChangeRef.current?.(displayedBakeryIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedIdsKey]);

  const handleItemClick = (item: CurationItem, index: number) => {
    if (onCardClick) {
      onCardClick(item, index);
      return;
    }
    if (item.bakeryId != null) {
      void navigate({
        to: "/bbangteo-bakery-detail",
        search: {
          bakeryId: item.bakeryId,
          from: bakeryListEntryFrom,
          courseId: undefined,
          reviewUploaded: undefined,
          reviewTab: undefined,
        },
      });
    }
  };

  const skeletonClass = compact
    ? "h-[92px] w-[118px] flex-shrink-0 rounded-[var(--radius-r3)]"
    : "h-[240px] w-[254px] flex-shrink-0 rounded-[var(--radius-r3)]";

  if (loading || (lockSelectionOnMount && !readyToPick)) {
    return (
      <div className="flex w-full gap-[var(--spacing-x4)] overflow-x-auto overflow-y-hidden pb-1">
        {Array.from({ length: displayCount }).map((_, i) => (
          <Skeleton key={i} className={skeletonClass} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center rounded-[var(--radius-r3)] bg-[var(--color-gray-200)] px-4 text-center text-[length:var(--font-size-3)] text-[var(--color-gray-600)]">
        빵집 목록을 불러오지 못했어요
      </div>
    );
  }

  return (
    <CurationFooter
      items={items}
      itemClassName={compact ? "!w-[118px] shrink-0" : undefined}
      cardImageClassName={compact ? "!w-[118px] !h-[92px]" : undefined}
      breadIconClassName={compact ? "!w-[28px] !h-[28px]" : undefined}
      onItemClick={handleItemClick}
    />
  );
}
