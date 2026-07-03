import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getBakeryById } from "@/api/bakery";
import type { BakeryDetail, BakeryListItem, BakerySortType } from "@/api/types/bakery";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { SafeImage } from "@/components/common/SafeImage";
import { AppIcon, IconAssets } from "@/components/icons";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import { CURATION_BBANGTEO_DISPLAY_COUNT } from "@/components/domain/home/curationBakeryContentParams";
import {
  DONG_REGION_FALLBACK,
  shouldExcludeFromDongCuration,
} from "@/components/domain/home/dongCurationParams";
import { useTrendMenuIndex } from "@/hooks/trend/useTrendMenuFallback";
import { trendQueryKeys } from "@/hooks/trend/trendQueryKeys";
import { useBakeries } from "@/hooks/useBakeries";
import {
  getBakeryLikeOverlay,
  mergeBakeryListItemWithLikeOverlay,
  subscribeBakeryLikeOverlayChange,
} from "@/lib/bakeryLikeLocalCache";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import { buildBbakeryDetailSearch } from "@/utils/bakeryListEntry";
import TrendBreadCategoryTabBar from "@/components/domain/trend/TrendBreadCategoryTabBar";
import { useTrendingBreads } from "@/hooks/trend/useTrendingBreads";
import { buildBbangteoBakeryListSearch } from "@/utils/bakeryListEntry";
import { buildTrendBreadListTitle, resolveBakeryIdsForKeyword } from "@/utils/trendCuration";
import { cn } from "@/utils/cn";
import { resolveThumbnailDongAddress } from "@/utils/formatCurationAddress";
import {
  formatBakeryRating,
  resolveBakeryRating,
  resolveBakeryReviewCount,
  shouldShowBakeryRating,
} from "@/utils/bakeryRating";
import { isListItemOpenNow } from "@/utils/bakeryBusinessHours";
import { BakeryMapExplorer } from "@/components/domain/bakery-map";
import type { BakeryMapPoint, BakeryMapViewMode } from "@/components/domain/bakery-map/types";
import { useBakeryMapLocation } from "@/hooks/useBakeryMapLocation";
import { BAKERY_MAP_FETCH_SIZE, buildBakeryMapNearbySearchParams } from "@/lib/bakeryMapConstants";

const PAGE_SIZE = 6;
const OPEN_FILTER_FETCH_SIZE = 60;

type BakeryListSort = Extract<BakerySortType, "RATING" | "REVIEW_COUNT" | "LIKE_COUNT">;

const BAKERY_LIST_SORT_OPTIONS: { value: BakeryListSort; label: string }[] = [
  { value: "RATING", label: "별점순" },
  { value: "REVIEW_COUNT", label: "리뷰순" },
  { value: "LIKE_COUNT", label: "좋아요순" },
];

function sortBakeryRows(rows: BakeryRow[], sort: BakeryListSort): BakeryRow[] {
  const copy = [...rows];
  if (sort === "REVIEW_COUNT") {
    copy.sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating || b.id - a.id);
    return copy;
  }
  if (sort === "LIKE_COUNT") {
    copy.sort(
      (a, b) =>
        b.bookmarkCount - a.bookmarkCount ||
        b.rating - a.rating ||
        b.reviewCount - a.reviewCount ||
        b.id - a.id,
    );
    return copy;
  }
  copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || b.id - a.id);
  return copy;
}

function filterBakeryRowsByOpenOnly(rows: BakeryRow[], openOnly: boolean): BakeryRow[] {
  if (!openOnly) return rows;
  return rows.filter((row) => isListItemOpenNow(row));
}

function filterRowsByKeyword(rows: BakeryRow[], keyword: string): BakeryRow[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (row) => row.name.toLowerCase().includes(q) || row.address.toLowerCase().includes(q),
  );
}

type BakeryRow = {
  id: number;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  bookmarkCount: number;
  liked: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  /** 최대 4개 미리보기 URL */
  images: string[];
  /** 4장 초과분 — 4번째 타일에 더보기 오버레이 */
  remainingPreviewImageCount: number;
  lat?: number | null;
  lng?: number | null;
};

const PREVIEW_SLOTS = 4 as const;

function mapListItemToBakeryRow(b: BakeryListItem): BakeryRow {
  const item = mergeBakeryListItemWithLikeOverlay(b);
  const previews =
    item.previewImageUrls != null && item.previewImageUrls.length > 0
      ? item.previewImageUrls.slice(0, PREVIEW_SLOTS)
      : item.thumbnailUrl
        ? [item.thumbnailUrl]
        : [];
  const remaining =
    item.remainingPreviewImageCount != null && Number.isFinite(item.remainingPreviewImageCount)
      ? Math.max(0, Math.floor(item.remainingPreviewImageCount))
      : 0;
  return {
    id: item.id,
    name: item.name,
    address: resolveThumbnailDongAddress(item.address, item.dong, item.name),
    rating: resolveBakeryRating(item.rating),
    reviewCount: resolveBakeryReviewCount(item.reviewCount),
    bookmarkCount: item.likeCount ?? 0,
    liked: Boolean(item.liked),
    openTime: item.openTime,
    closeTime: item.closeTime,
    images: previews,
    remainingPreviewImageCount: remaining,
    lat: item.lat,
    lng: item.lng,
  };
}

function applyLikeOverlayToBakeryRow(row: BakeryRow): BakeryRow {
  const o = getBakeryLikeOverlay(row.id);
  if (!o) return row;
  return { ...row, liked: o.liked, bookmarkCount: Math.max(row.bookmarkCount, o.likeCount) };
}

function mapDetailToBakeryRow(detail: BakeryDetail): BakeryRow {
  const urls = detail.imageUrls ?? [];
  const previews = urls.slice(0, PREVIEW_SLOTS);
  const remaining = Math.max(0, urls.length - PREVIEW_SLOTS);
  return {
    id: detail.id,
    name: detail.name,
    address: resolveThumbnailDongAddress(detail.address, detail.dong, detail.name),
    rating: resolveBakeryRating(detail.rating),
    reviewCount: resolveBakeryReviewCount(detail.reviewCount),
    bookmarkCount: detail.likeCount ?? 0,
    liked: Boolean(detail.liked),
    openTime: detail.openTime,
    closeTime: detail.closeTime,
    images: previews,
    remainingPreviewImageCount: remaining,
    lat: detail.lat,
    lng: detail.lng,
  };
}

const PageHeader = ({
  title,
  listEntryFrom,
  viewMode,
  onViewModeToggle,
}: {
  title: string;
  listEntryFrom?: BakeryListEntryFrom;
  viewMode?: BakeryMapViewMode;
  onViewModeToggle?: () => void;
}) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (listEntryFrom === "home") {
      void navigate({ to: "/home" });
      return;
    }
    if (listEntryFrom === "bbangteo" || listEntryFrom === "bbangteo-home") {
      void navigate({ to: "/bbangteo" });
      return;
    }
    window.history.back();
  };

  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="relative flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center text-[22px]"
            onClick={handleBack}
          >
            <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="뒤로가기" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] leading-[24px] font-bold text-[#1a1c20]">
            {title}
          </h1>
          {onViewModeToggle ? (
            <button
              type="button"
              className="flex h-[36px] w-[36px] items-center justify-center"
              onClick={onViewModeToggle}
              aria-label={viewMode === "map" ? "리스트 보기" : "지도 보기"}
            >
              <AppIcon
                src={viewMode === "map" ? IconAssets.IcMenu : IconAssets.IcCompass}
                size="x6"
                alt=""
              />
            </button>
          ) : (
            <div className="h-[36px] w-[36px]" />
          )}
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

const SortFilterChip = ({
  value,
  onChange,
}: {
  value: BakeryListSort;
  onChange: (sort: BakeryListSort) => void;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    BAKERY_LIST_SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? "별점순";

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex max-h-[34px] items-center rounded-[9999px] bg-[#f3f4f5] p-[8px]"
      >
        <span className="px-[4px] text-[14px] leading-[19px] text-[#1a1c20]">{selectedLabel}</span>
        <AppIcon
          src={IconAssets.IcChevronDown}
          size={18}
          alt=""
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="정렬"
          className="absolute left-0 top-[calc(100%+4px)] z-30 min-w-[112px] overflow-hidden rounded-[12px] border border-[#eeeff1] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          {BAKERY_LIST_SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full px-[12px] py-[10px] text-left text-[14px] leading-[19px] text-[#1a1c20]",
                  isSelected ? "bg-[#f3f4f5] font-semibold" : "font-medium hover:bg-[#f9fafb]",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const OpenFilterChip = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onToggle}
    className={cn(
      "flex max-h-[34px] items-center rounded-[9999px] p-[8px] transition-colors",
      active ? "bg-orange-600" : "bg-[#f3f4f5]",
    )}
  >
    <span
      className={cn(
        "px-[4px] text-[14px] leading-[19px]",
        active ? "font-semibold text-white" : "text-[#1a1c20]",
      )}
    >
      영업 중
    </span>
  </button>
);

const SearchFilterSection = ({
  keyword,
  onKeywordChange,
  sort,
  onSortChange,
  openOnly,
  onOpenOnlyToggle,
  hideKeywordSearch = false,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
  sort: BakeryListSort;
  onSortChange: (sort: BakeryListSort) => void;
  openOnly: boolean;
  onOpenOnlyToggle: () => void;
  hideKeywordSearch?: boolean;
}) => (
  <section className="flex flex-col gap-[16px] bg-white px-[20px] py-[12px]">
    {hideKeywordSearch ? null : (
      <div className="flex h-[56px] items-center gap-x1-5 rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
        <input
          type="search"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="빵집을 검색해보세요"
          className="flex-1 bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none"
        />
        <AppIcon src={IconAssets.IcSearch} size="x6" />
      </div>
    )}
    <div className="flex items-center gap-[8px]">
      <SortFilterChip value={sort} onChange={onSortChange} />
      <OpenFilterChip active={openOnly} onToggle={onOpenOnlyToggle} />
    </div>
  </section>
);

const BakeryMeta = ({
  rating,
  reviewCount,
  bookmarkCount,
  liked,
}: Pick<BakeryRow, "rating" | "reviewCount" | "bookmarkCount" | "liked">) => {
  const showRating = shouldShowBakeryRating(reviewCount);

  return (
    <div className="flex h-[18px] items-center gap-[4px]">
      {showRating ? (
        <>
          <div className="flex items-center gap-[2px]">
            <AppIcon
              src={IconAssets.IcStar}
              size={14}
              className="icon-orange-600 shrink-0"
              alt=""
            />
            <span className="text-[13px] leading-[18px] text-[#868b94]">
              {formatBakeryRating(rating)}
            </span>
            <span className="text-[13px] leading-[18px] text-[#868b94]">
              ({reviewCount.toLocaleString()})
            </span>
          </div>
          <span className="text-[13px] leading-[18px] text-[#868b94]">·</span>
        </>
      ) : null}
      <div className="flex items-center gap-[2px]">
        <AppIcon
          src={IconAssets.IcHeart}
          size={14}
          className={cn("shrink-0", liked ? "icon-orange-600" : "icon-gray-600 opacity-60")}
          alt=""
        />
        <span className="text-[13px] leading-[18px] text-[#868b94]">{bookmarkCount}</span>
      </div>
    </div>
  );
};

const BakeryImageRow = ({
  images,
  remainingPreviewImageCount,
  bakeryName,
}: {
  images: string[];
  remainingPreviewImageCount: number;
  bakeryName: string;
}) => {
  const slots: (string | null)[] = Array.from(
    { length: PREVIEW_SLOTS },
    (_, i) => images[i] ?? null,
  );
  const showMoreOnLast = remainingPreviewImageCount > 0 && slots[PREVIEW_SLOTS - 1] != null;

  return (
    <div className="grid w-full grid-cols-4 gap-[6px]">
      {slots.map((url, index) => {
        const isLast = index === PREVIEW_SLOTS - 1;
        const showOverlay = isLast && showMoreOnLast;
        return (
          <div
            key={`${bakeryName}-slot-${index}`}
            className="relative aspect-square w-full overflow-hidden rounded-[8px] bg-[#f3f4f5]"
            aria-label={
              showOverlay
                ? `${bakeryName} 이미지 ${index + 1}, 더보기 ${remainingPreviewImageCount}장`
                : `${bakeryName} 이미지 ${index + 1}`
            }
          >
            {url ? (
              <SafeImage src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <img
                  src={currationBreadImg}
                  alt=""
                  className="h-[28px] w-[29px] object-contain opacity-60"
                />
              </div>
            )}
            {showOverlay ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2px] bg-black/50 px-1 text-center text-white">
                <span className="text-[12px] leading-[16px] font-semibold">더보기</span>
                <span className="text-[11px] leading-[14px] font-medium opacity-95">
                  +{remainingPreviewImageCount}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const BakeryCard = ({
  bakery,
  selected = false,
  onClick,
}: {
  bakery: BakeryRow;
  selected?: boolean;
  onClick?: () => void;
}) => (
  <article
    className={cn(
      "flex flex-col gap-[12px] border-b border-[#f3f4f5] px-[20px] py-[18px]",
      selected && "bg-orange-100/60",
    )}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        onClick?.();
      }
    }}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    <div className="flex flex-col gap-[4px]">
      <h2 className="line-clamp-1 text-[18px] leading-[24px] font-medium text-[#1a1c20]">
        {bakery.name}
      </h2>
      <div className="flex flex-col gap-[2px]">
        <p className="line-clamp-1 text-[14px] leading-[19px] text-[#868b94]">{bakery.address}</p>
        <BakeryMeta
          rating={bakery.rating}
          reviewCount={bakery.reviewCount}
          bookmarkCount={bakery.bookmarkCount}
          liked={bakery.liked}
        />
      </div>
    </div>
    <BakeryImageRow
      images={bakery.images}
      remainingPreviewImageCount={bakery.remainingPreviewImageCount}
      bakeryName={bakery.name}
    />
  </article>
);

const BakeryList = ({
  items,
  selectedBakeryId,
  onItemClick,
}: {
  items: BakeryRow[];
  selectedBakeryId?: number | null;
  onItemClick?: (bakery: BakeryRow) => void;
}) => (
  <section className="flex flex-col">
    {items.map((bakery) => (
      <BakeryCard
        key={bakery.id}
        bakery={bakery}
        selected={bakery.id === selectedBakeryId}
        onClick={onItemClick ? () => onItemClick(bakery) : undefined}
      />
    ))}
  </section>
);

const PAGE_NUMBER_WINDOW_SIZE = 5;

function getVisiblePageWindow(
  currentPage: number,
  totalPages: number,
): { start: number; end: number } {
  if (totalPages <= PAGE_NUMBER_WINDOW_SIZE) {
    return { start: 0, end: totalPages - 1 };
  }

  let start = currentPage - Math.floor(PAGE_NUMBER_WINDOW_SIZE / 2);
  if (start < 0) start = 0;

  let end = start + PAGE_NUMBER_WINDOW_SIZE - 1;
  if (end >= totalPages) {
    end = totalPages - 1;
    start = end - PAGE_NUMBER_WINDOW_SIZE + 1;
  }

  return { start, end };
}

function PageNumberNav({
  currentPage,
  totalPages,
  onSelectPage,
}: {
  currentPage: number;
  totalPages: number;
  onSelectPage: (pageIndex: number) => void;
}) {
  if (totalPages <= 1) return null;

  const { start, end } = getVisiblePageWindow(currentPage, totalPages);
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;
  const navButtonClass =
    "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#f3f4f5] text-[#1a1c20] transition-colors enabled:hover:bg-[#e8eaed] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-[#eeeff1] px-[16px] py-[14px] pb-[max(14px,env(safe-area-inset-bottom))]"
      aria-label="페이지"
    >
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={!canGoPrev}
        onClick={() => onSelectPage(currentPage - 1)}
        className={navButtonClass}
      >
        <AppIcon src={IconAssets.IcChevronLeft} size={18} alt="" />
      </button>

      {Array.from({ length: end - start + 1 }, (_, offset) => start + offset).map((pageIndex) => {
        const isActive = pageIndex === currentPage;
        return (
          <button
            key={pageIndex}
            type="button"
            onClick={() => onSelectPage(pageIndex)}
            className={cn(
              "flex h-[36px] min-w-[36px] items-center justify-center rounded-[10px] px-2 text-[15px] font-semibold transition-colors",
              isActive
                ? "bg-[#1a1c20] text-white"
                : "bg-[#f3f4f5] text-[#1a1c20] hover:bg-[#e8eaed]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {pageIndex + 1}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="다음 페이지"
        disabled={!canGoNext}
        onClick={() => onSelectPage(currentPage + 1)}
        className={navButtonClass}
      >
        <AppIcon src={IconAssets.IcChevronRight} size={18} alt="" />
      </button>
    </nav>
  );
}

type BbangteoBakeryListPageProps = {
  listEntryFrom?: BakeryListEntryFrom;
  /** 큐레이션 카드에 노출된 빵집 id 순서(첫 페이지 상단 고정) */
  curationPinIds?: number[];
  /** true면 큐레이션에 포함된 빵집만 표시 */
  curationOnly?: boolean;
  /** 동 큐레이션 더보기 — 해당 행정동 빵집만 표시 */
  dongFilter?: string;
  /** 동 큐레이션에서 제외할 빵집 id (홈 1번 큐레이션과 중복 방지) */
  excludePinIds?: number[];
  /** SNS 트렌드 빵 키워드 — 해당 빵을 파는 빵집만 표시 */
  breadKeyword?: string;
  /** URL에서 전달된 빵집 검색어 */
  initialKeyword?: string;
};

const BbangteoBakeryListPage = ({
  listEntryFrom,
  curationPinIds,
  curationOnly = false,
  dongFilter,
  excludePinIds,
  breadKeyword,
  initialKeyword,
}: BbangteoBakeryListPageProps) => {
  const navigate = useNavigate();
  const breadKeywordTrimmed = breadKeyword?.trim() ?? "";
  const isTrendBreadList = Boolean(breadKeywordTrimmed);
  const trendingBreadsQuery = useTrendingBreads(undefined, { enabled: isTrendBreadList });
  const trendCategoryBreads = useMemo(
    () => trendingBreadsQuery.data?.breads ?? [],
    [trendingBreadsQuery.data?.breads],
  );
  const menuIndexQuery = useTrendMenuIndex({ enabled: isTrendBreadList });
  const breadBakeriesQuery = useQuery({
    queryKey: trendQueryKeys.breadBakeries(breadKeywordTrimmed),
    queryFn: () => resolveBakeryIdsForKeyword(breadKeywordTrimmed, menuIndexQuery.data!.aiBakeries),
    enabled: isTrendBreadList && Boolean(menuIndexQuery.data?.aiBakeries.length),
    staleTime: 60_000,
  });
  const breadListPinIds = breadBakeriesQuery.data ?? [];
  const breadListResolving =
    isTrendBreadList && (menuIndexQuery.isLoading || breadBakeriesQuery.isLoading);
  const [keyword, setKeyword] = useState(initialKeyword?.trim() ?? "");
  const [listSort, setListSort] = useState<BakeryListSort>("RATING");
  const [openOnly, setOpenOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<BakeryMapViewMode>("list");
  const [selectedBakeryId, setSelectedBakeryId] = useState<number | null>(null);
  const isMapView = viewMode === "map";
  const {
    center: mapCenter,
    loading: mapLocationLoading,
    permissionDenied: mapPermissionDenied,
    recenterToUser: recenterMapToUser,
  } = useBakeryMapLocation(isMapView);
  const mapNearbyParams = useMemo(() => {
    if (!isMapView || mapLocationLoading) return null;
    return buildBakeryMapNearbySearchParams(mapCenter);
  }, [isMapView, mapLocationLoading, mapCenter]);
  const [fetchedPinRowsById, setFetchedPinRowsById] = useState<Map<number, BakeryRow>>(
    () => new Map(),
  );
  const [likeOverlayTick, setLikeOverlayTick] = useState(0);

  useEffect(() => subscribeBakeryLikeOverlayChange(() => setLikeOverlayTick((t) => t + 1)), []);

  const effectiveCurationPinIds = isTrendBreadList ? breadListPinIds : (curationPinIds ?? []);
  const effectiveCurationOnly = curationOnly || isTrendBreadList;
  const pageTitle = buildTrendBreadListTitle(isTrendBreadList ? breadKeywordTrimmed : undefined);

  const dongFilterTrimmed = dongFilter?.trim() ?? "";
  const isDongCurationList = curationOnly && Boolean(dongFilterTrimmed);

  const pinIdsKey = effectiveCurationPinIds.join(",");
  const pins = useMemo(() => {
    if (!pinIdsKey) return [];
    const ids = pinIdsKey
      .split(",")
      .map((segment) => Number.parseInt(segment.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (listEntryFrom === "bbangteo" && !isTrendBreadList) {
      return ids.slice(0, CURATION_BBANGTEO_DISPLAY_COUNT);
    }
    return ids;
  }, [pinIdsKey, listEntryFrom, isTrendBreadList]);

  const isPinOnlyList =
    !isDongCurationList &&
    (effectiveCurationOnly || listEntryFrom === "bbangteo") &&
    pins.length > 0 &&
    !keyword.trim();

  const useOpenFilterFetch = openOnly && !isDongCurationList && !isPinOnlyList;

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(0);
  };

  const handleSortChange = (sort: BakeryListSort) => {
    setListSort(sort);
    setPage(0);
  };

  const handleOpenOnlyToggle = () => {
    setOpenOnly((prev) => !prev);
    setPage(0);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, listSort, openOnly]);

  const handleTrendCategorySelect = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed || trimmed === breadKeywordTrimmed) return;
    void navigate({
      to: "/bbangteo-bakery-list",
      search: buildBbangteoBakeryListSearch({
        from: listEntryFrom,
        curationOnly: true,
        breadKeyword: trimmed,
      }),
      replace: true,
    });
  };

  const queryKeyword = keyword.trim() || undefined;
  const { data, loading, error } = useBakeries(
    {
      page: useOpenFilterFetch ? 0 : page,
      size: useOpenFilterFetch ? OPEN_FILTER_FETCH_SIZE : PAGE_SIZE,
      sort: listSort,
      open: openOnly,
      keyword: queryKeyword,
    },
    {
      enabled: !isDongCurationList && !(isTrendBreadList && pins.length === 0) && !isMapView,
    },
  );

  const mapListQuery = useBakeries(
    {
      page: 0,
      size: BAKERY_MAP_FETCH_SIZE,
      open: openOnly,
      keyword: queryKeyword,
      ...(mapNearbyParams ?? {}),
    },
    {
      enabled:
        isMapView &&
        mapNearbyParams != null &&
        !isDongCurationList &&
        !(isTrendBreadList && pins.length === 0),
    },
  );

  const regionFallback = dongFilterTrimmed ? DONG_REGION_FALLBACK[dongFilterTrimmed] : undefined;
  const dongListQuery = useBakeries(
    {
      page: 0,
      size: isMapView ? BAKERY_MAP_FETCH_SIZE : 60,
      open: openOnly,
      dong: dongFilterTrimmed,
      ...(isMapView && mapNearbyParams ? mapNearbyParams : { sort: listSort }),
    },
    { enabled: isDongCurationList && (!isMapView || mapNearbyParams != null) },
  );
  const dongListEmpty =
    isDongCurationList &&
    !dongListQuery.loading &&
    dongListQuery.data != null &&
    dongListQuery.data.bakeries.length === 0;
  const regionListQuery = useBakeries(
    {
      page: 0,
      size: isMapView ? BAKERY_MAP_FETCH_SIZE : 60,
      open: openOnly,
      region: regionFallback,
      ...(isMapView && mapNearbyParams ? mapNearbyParams : { sort: listSort }),
    },
    {
      enabled:
        isDongCurationList &&
        dongListEmpty &&
        Boolean(regionFallback) &&
        (!isMapView || mapNearbyParams != null),
    },
  );

  const excludeSet = useMemo(() => new Set(excludePinIds ?? []), [excludePinIds]);

  const dongCurationRows: BakeryRow[] = useMemo(() => {
    if (!isDongCurationList) return [];

    const sourceBakeries =
      dongFilterTrimmed && dongListQuery.data?.bakeries.length
        ? dongListQuery.data.bakeries
        : dongListEmpty && regionListQuery.data?.bakeries.length
          ? regionListQuery.data.bakeries
          : (dongListQuery.data?.bakeries ?? []);

    const filtered = sourceBakeries.filter(
      (bakery) =>
        !excludeSet.has(bakery.id) && !shouldExcludeFromDongCuration(bakery, dongFilterTrimmed),
    );
    const rows = filtered.map((bakery) =>
      applyLikeOverlayToBakeryRow(mapListItemToBakeryRow(bakery)),
    );
    const sorted = isMapView ? rows : sortBakeryRows(rows, listSort);
    return filterBakeryRowsByOpenOnly(filterRowsByKeyword(sorted, keyword), openOnly);
  }, [
    isDongCurationList,
    isMapView,
    dongFilterTrimmed,
    dongListQuery.data,
    dongListEmpty,
    regionListQuery.data,
    excludeSet,
    listSort,
    openOnly,
    keyword,
  ]);

  const dongLoading =
    isDongCurationList &&
    (dongListQuery.loading ||
      (dongListEmpty && Boolean(regionFallback) && regionListQuery.loading));
  const dongError =
    isDongCurationList && (dongListQuery.error ?? (dongListEmpty ? regionListQuery.error : null));

  const pinResolutionActive =
    !isMapView &&
    !openOnly &&
    !isDongCurationList &&
    page === 0 &&
    queryKeyword == null &&
    pins.length > 0 &&
    (isPinOnlyList || Boolean(data?.bakeries?.length));

  const listIds = useMemo(() => new Set(data?.bakeries?.map((b) => b.id) ?? []), [data?.bakeries]);

  const pinIdsToFetch = useMemo(() => {
    if (!pinResolutionActive) {
      return [];
    }
    return pins.filter((id) => !listIds.has(id));
  }, [pinResolutionActive, pins, listIds]);

  const pinIdsToFetchKey = pinIdsToFetch.join(",");

  const resolvedPinRowsById = useMemo(() => {
    if (!pinResolutionActive || pinIdsToFetch.length === 0) {
      return new Map<number, BakeryRow>();
    }
    const next = new Map<number, BakeryRow>();
    for (const id of pinIdsToFetch) {
      const row = fetchedPinRowsById.get(id);
      if (row && likeOverlayTick >= 0) {
        next.set(id, applyLikeOverlayToBakeryRow(row));
      }
    }
    return next;
  }, [pinResolutionActive, pinIdsToFetch, fetchedPinRowsById, likeOverlayTick]);

  useEffect(() => {
    if (!pinResolutionActive || !pinIdsToFetchKey) {
      return;
    }

    const idsToResolve = pinIdsToFetchKey
      .split(",")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (idsToResolve.length === 0) {
      return;
    }

    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        idsToResolve.map(async (id) => {
          try {
            const d = await getBakeryById(id);
            return [id, mapDetailToBakeryRow(d)] as const;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) {
        return;
      }
      const next = new Map<number, BakeryRow>();
      for (const r of results) {
        if (r) {
          next.set(r[0], r[1]);
        }
      }
      setFetchedPinRowsById((prev) => {
        const merged = new Map(prev);
        for (const [id, row] of next) {
          merged.set(id, row);
        }
        return merged;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [pinResolutionActive, pinIdsToFetchKey]);

  const apiRows: BakeryRow[] = useMemo(() => {
    const source = isMapView ? mapListQuery.data?.bakeries : data?.bakeries;
    if (!source?.length) return [];
    return source.map((b) => {
      const row = mapListItemToBakeryRow(b);
      return likeOverlayTick >= 0 ? applyLikeOverlayToBakeryRow(row) : row;
    });
  }, [data, isMapView, likeOverlayTick, mapListQuery.data]);

  const openFilteredRows: BakeryRow[] = useMemo(() => {
    if (!useOpenFilterFetch || !apiRows.length) return [];
    return sortBakeryRows(filterBakeryRowsByOpenOnly(apiRows, true), listSort);
  }, [useOpenFilterFetch, apiRows, listSort]);

  const rows: BakeryRow[] = useMemo(() => {
    if (isDongCurationList) {
      return dongCurationRows;
    }

    if (useOpenFilterFetch) {
      const start = page * PAGE_SIZE;
      return openFilteredRows.slice(start, start + PAGE_SIZE);
    }

    const applyPins =
      page === 0 && !queryKeyword && pins.length > 0 && listSort === "RATING" && !openOnly;

    if (isPinOnlyList) {
      const pinnedOrdered: BakeryRow[] = [];
      for (const id of pins) {
        const fromList = apiRows.find((r) => r.id === id);
        const fetched = resolvedPinRowsById.get(id);
        const row = fromList ?? fetched;
        if (row) pinnedOrdered.push(row);
      }
      return filterBakeryRowsByOpenOnly(sortBakeryRows(pinnedOrdered, listSort), openOnly);
    }

    if (!apiRows.length) return [];
    if (!applyPins) {
      return filterBakeryRowsByOpenOnly(sortBakeryRows(apiRows, listSort), openOnly);
    }

    const pinSet = new Set(pins);
    const pinnedOrdered: BakeryRow[] = [];
    for (const id of pins) {
      const fromList = apiRows.find((r) => r.id === id);
      const fetched = resolvedPinRowsById.get(id);
      const row = fromList ?? fetched;
      if (row) pinnedOrdered.push(row);
    }
    const tail = sortBakeryRows(
      apiRows.filter((r) => !pinSet.has(r.id)),
      listSort,
    );
    return filterBakeryRowsByOpenOnly([...pinnedOrdered, ...tail], openOnly).slice(0, PAGE_SIZE);
  }, [
    isDongCurationList,
    dongCurationRows,
    apiRows,
    page,
    queryKeyword,
    pins,
    resolvedPinRowsById,
    isPinOnlyList,
    listSort,
    openOnly,
    useOpenFilterFetch,
    openFilteredRows,
  ]);

  const mapRows: BakeryRow[] = useMemo(() => {
    if (!isMapView) return [];

    if (isDongCurationList) {
      return dongCurationRows;
    }

    let rows = apiRows;

    if (isPinOnlyList) {
      const pinSet = new Set(pins);
      rows = rows.filter((row) => pinSet.has(row.id));
    }

    if (useOpenFilterFetch) {
      return filterBakeryRowsByOpenOnly(rows, true);
    }

    return filterBakeryRowsByOpenOnly(filterRowsByKeyword(rows, keyword), openOnly);
  }, [
    isMapView,
    isDongCurationList,
    dongCurationRows,
    isPinOnlyList,
    pins,
    apiRows,
    openOnly,
    keyword,
    useOpenFilterFetch,
  ]);

  const listLoading =
    !isMapView &&
    ((isTrendBreadList && (menuIndexQuery.isLoading || breadListResolving)) ||
      (isDongCurationList ? dongLoading : loading));
  const mapDataLoading =
    isMapView &&
    !mapLocationLoading &&
    ((isTrendBreadList && (menuIndexQuery.isLoading || breadListResolving)) ||
      (isDongCurationList ? dongLoading : mapListQuery.loading));
  const listError = isDongCurationList ? dongError : error;
  const mapError =
    isMapView && isDongCurationList ? dongError : isMapView ? mapListQuery.error : null;
  const isCurationScopedList = isDongCurationList || isPinOnlyList;

  const totalPages = useOpenFilterFetch
    ? openFilteredRows.length === 0
      ? 0
      : Math.ceil(openFilteredRows.length / PAGE_SIZE)
    : (data?.total ?? 0) === 0
      ? 0
      : Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const handleBakeryClick = (bakery: BakeryRow) => {
    setSelectedBakeryId(bakery.id);
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: buildBbakeryDetailSearch({
        bakeryId: bakery.id,
        from: listEntryFrom,
        trendBread: isTrendBreadList ? breadKeywordTrimmed : undefined,
      }),
    });
  };

  const handleMapBakeryDetail = (bakery: BakeryMapPoint) => {
    setSelectedBakeryId(bakery.id);
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: buildBbakeryDetailSearch({
        bakeryId: bakery.id,
        from: listEntryFrom,
        trendBread: isTrendBreadList ? breadKeywordTrimmed : undefined,
      }),
    });
  };

  const handleViewModeToggle = () => {
    setViewMode((prev) => (prev === "list" ? "map" : "list"));
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <PageHeader
          title={pageTitle}
          listEntryFrom={listEntryFrom}
          viewMode={viewMode}
          onViewModeToggle={handleViewModeToggle}
        />
        <main
          className={cn(
            "flex flex-1 flex-col pb-[56px] sm:pb-[60px]",
            isMapView && "min-h-0 overflow-hidden pb-0 sm:pb-0",
          )}
        >
          <SearchFilterSection
            keyword={keyword}
            onKeywordChange={handleKeywordChange}
            sort={listSort}
            onSortChange={handleSortChange}
            openOnly={openOnly}
            onOpenOnlyToggle={handleOpenOnlyToggle}
            hideKeywordSearch={isTrendBreadList}
          />
          {isTrendBreadList ? (
            <TrendBreadCategoryTabBar
              breads={trendCategoryBreads}
              selectedKeyword={breadKeywordTrimmed}
              onSelect={handleTrendCategorySelect}
            />
          ) : null}
          {isMapView ? (
            mapError ? (
              <div className="flex flex-1 flex-col items-center justify-center px-[20px] py-[40px] text-center text-[14px] text-[#868b94]">
                {mapError.message}
              </div>
            ) : (
              <BakeryMapExplorer
                rows={mapRows}
                loading={mapDataLoading}
                mapCenter={mapCenter}
                locationLoading={mapLocationLoading}
                permissionDenied={mapPermissionDenied}
                onRecenter={recenterMapToUser}
                selectedBakeryId={selectedBakeryId}
                onSelectedBakeryIdChange={setSelectedBakeryId}
                onBakeryDetail={handleMapBakeryDetail}
                className="min-h-0 flex-1"
              />
            )
          ) : listLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-[20px] py-[40px] text-[14px] text-[#868b94]">
              불러오는 중…
            </div>
          ) : listError ? (
            <div className="flex flex-1 flex-col items-center justify-center px-[20px] py-[40px] text-center text-[14px] text-[#868b94]">
              {listError.message}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-[16px] px-[20px] py-[40px] text-center text-[14px] text-[#868b94]">
              <p>
                {isTrendBreadList
                  ? `'${breadKeywordTrimmed}'을 파는 빵집이 없어요.`
                  : openOnly
                    ? "영업 중인 빵집이 없어요."
                    : "빵집이 없습니다."}
              </p>
              <button
                type="button"
                className="rounded-[10px] border border-[#E8623A] px-[16px] py-[10px] text-[14px] font-semibold text-[#E8623A]"
                onClick={() => void navigate({ to: "/bbangteo-bakery-suggest" })}
              >
                빵집 등록 건의하기
              </button>
            </div>
          ) : (
            <>
              <BakeryList
                items={rows}
                selectedBakeryId={selectedBakeryId}
                onItemClick={handleBakeryClick}
              />
              {totalPages > 0 && !isCurationScopedList ? (
                <PageNumberNav currentPage={page} totalPages={totalPages} onSelectPage={setPage} />
              ) : null}
            </>
          )}
        </main>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryListPage;
