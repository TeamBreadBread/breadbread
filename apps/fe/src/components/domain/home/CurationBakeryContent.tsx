import { useEffect, useMemo } from "react";
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
};

export function CurationBakeryContent({
  compact,
  bakeryListEntryFrom,
  onCardClick,
  onDisplayedBakeryIdsChange,
  displayCount: displayCountProp,
}: CurationBakeryContentProps) {
  const navigate = useNavigate();
  const displayCount = displayCountProp ?? CURATION_DISPLAY_COUNT;
  const listParams: GetBakeriesParams = useMemo(
    () => ({
      ...CURATION_BAKERY_LIST_PARAMS,
      size: Math.max(CURATION_BAKERY_LIST_PARAMS.size, displayCount),
    }),
    [displayCount],
  );
  const { data, loading, error } = useBakeries(listParams);

  const items: CurationItem[] = useMemo(() => {
    if (!data?.bakeries?.length) return [];
    const picked = shuffleArray(data.bakeries).slice(0, displayCount);
    return picked.map((b) => ({
      bakeryId: b.id,
      title: b.name,
      address: b.address?.trim() ? formatCurationAddress(b.address.trim()) : "주소 정보 없음",
      rate: b.rating != null ? Number(b.rating) : 0,
    }));
  }, [data, displayCount]);

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

  if (loading) {
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
