import { useEffect, useMemo, useState } from "react";
import type { GetBakeriesParams } from "@/api/types/bakery";
import { useNavigate } from "@tanstack/react-router";
import Skeleton from "@/components/common/skeleton/Skeleton";
import { useBakeries } from "@/hooks/useBakeries";
import { formatCurationAddress } from "@/utils/formatCurationAddress";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import {
  CURATION_BAKERY_LIST_PARAMS,
  CURATION_DISPLAY_COUNT,
  shuffleArray,
} from "./curationBakeryContentParams";
import { bakeryMatchesDong } from "./matchBakeryByDong";
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
  /** 주소/이름에 포함되는 키워드로 클라이언트 필터링 */
  localKeywordFilter?: string;
  /** true면 마운트(새로고침) 후 첫 픽만 사용하고 이후 재섞지 않음 */
  lockSelectionOnMount?: boolean;
  /** lock 사용 시 false면 스켈레톤 유지 (위 큐레이션 id 대기 등) */
  readyToPick?: boolean;
};

export function CurationBakeryContent({
  compact,
  bakeryListEntryFrom,
  onCardClick,
  onDisplayedBakeryIdsChange,
  displayCount: displayCountProp,
  listParamsOverride,
  excludeBakeryIds,
  localKeywordFilter,
  lockSelectionOnMount = false,
  readyToPick = true,
}: CurationBakeryContentProps) {
  const navigate = useNavigate();
  const [lockedItems, setLockedItems] = useState<CurationItem[] | null>(null);
  const displayCount = displayCountProp ?? CURATION_DISPLAY_COUNT;
  const listParams: GetBakeriesParams = useMemo(() => {
    const requestedSize = listParamsOverride?.size ?? CURATION_BAKERY_LIST_PARAMS.size;
    return {
      ...CURATION_BAKERY_LIST_PARAMS,
      ...listParamsOverride,
      size: Math.max(requestedSize, displayCount),
    };
  }, [displayCount, listParamsOverride]);
  const { data, loading, error } = useBakeries(listParams);

  const pickedItems: CurationItem[] = useMemo(() => {
    if (lockSelectionOnMount && !readyToPick) {
      return [];
    }
    if (!data?.bakeries?.length) return [];

    const keyword = localKeywordFilter?.trim();
    const scopedByKeyword = keyword
      ? data.bakeries.filter((bakery) => bakeryMatchesDong(bakery, keyword))
      : data.bakeries;
    const excluded = new Set(excludeBakeryIds ?? []);
    const filtered = scopedByKeyword.filter((bakery) => !excluded.has(bakery.id));
    const source = filtered.length > 0 ? filtered : scopedByKeyword;
    const picked = shuffleArray(source).slice(0, displayCount);
    const addressMaxTokens = compact ? 2 : 4;
    return picked.map((b) => ({
      bakeryId: b.id,
      title: b.name,
      address: b.address?.trim()
        ? formatCurationAddress(b.address.trim(), addressMaxTokens)
        : "주소 정보 없음",
      rate: b.rating != null ? Number(b.rating) : 0,
    }));
  }, [
    data,
    displayCount,
    excludeBakeryIds,
    localKeywordFilter,
    compact,
    lockSelectionOnMount,
    readyToPick,
  ]);

  // 첫 픽만 state에 고정 (리프레시마다 재섞임 방지)
  useEffect(() => {
    if (!lockSelectionOnMount || !readyToPick || pickedItems.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lock-on-mount one-time snapshot
    setLockedItems((prev) => prev ?? pickedItems);
  }, [lockSelectionOnMount, readyToPick, pickedItems]);

  const items = lockSelectionOnMount && lockedItems ? lockedItems : pickedItems;

  useEffect(() => {
    if (!onDisplayedBakeryIdsChange) return;
    const ids = items
      .map((i) => i.bakeryId)
      .filter((id): id is number => typeof id === "number" && id > 0);
    onDisplayedBakeryIdsChange(ids);
  }, [items, onDisplayedBakeryIdsChange]);

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
      metaIconClassName={compact ? "icon-gray-600" : undefined}
      onItemClick={handleItemClick}
    />
  );
}
