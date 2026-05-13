import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getBakeryById } from "@/api/bakery";
import type { BakeryDetail, BakeryListItem } from "@/api/types/bakery";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import ratingStar from "@/assets/icons/ratingStar.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import { useBakeries } from "@/hooks/useBakeries";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 6;

type BakeryRow = {
  id: number;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  bookmarkCount: number;
  /** 최대 4개 미리보기 URL */
  images: string[];
  /** 4장 초과분 — 4번째 타일에 더보기 오버레이 */
  remainingPreviewImageCount: number;
};

const PREVIEW_SLOTS = 4 as const;

function mapListItemToBakeryRow(b: BakeryListItem): BakeryRow {
  const previews =
    b.previewImageUrls != null && b.previewImageUrls.length > 0
      ? b.previewImageUrls.slice(0, PREVIEW_SLOTS)
      : b.thumbnailUrl
        ? [b.thumbnailUrl]
        : [];
  const remaining =
    b.remainingPreviewImageCount != null && Number.isFinite(b.remainingPreviewImageCount)
      ? Math.max(0, Math.floor(b.remainingPreviewImageCount))
      : 0;
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    rating: b.rating != null ? Number(b.rating) : 0,
    reviewCount: 0,
    bookmarkCount: b.likeCount ?? 0,
    images: previews,
    remainingPreviewImageCount: remaining,
  };
}

function mapDetailToBakeryRow(detail: BakeryDetail): BakeryRow {
  const urls = detail.imageUrls ?? [];
  const previews = urls.slice(0, PREVIEW_SLOTS);
  const remaining = Math.max(0, urls.length - PREVIEW_SLOTS);
  return {
    id: detail.id,
    name: detail.name,
    address: detail.address,
    rating: detail.rating != null ? Number(detail.rating) : 0,
    reviewCount: 0,
    bookmarkCount: detail.likeCount ?? 0,
    images: previews,
    remainingPreviewImageCount: remaining,
  };
}

const CircleIcon = ({ size = 18, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const PageHeader = ({
  title,
  listEntryFrom,
}: {
  title: string;
  listEntryFrom?: BakeryListEntryFrom;
}) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (listEntryFrom === "home") {
      void navigate({ to: "/home" });
      return;
    }
    if (listEntryFrom === "bbangteo") {
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
            <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] leading-[24px] font-bold text-[#1a1c20]">
            {title}
          </h1>
          <div className="h-[36px] w-[36px]" />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

const FilterChip = ({ label, withIcon = false }: { label: string; withIcon?: boolean }) => (
  <button
    type="button"
    className="flex max-h-[34px] items-center rounded-[9999px] bg-[#f3f4f5] p-[8px]"
  >
    <span className="px-[4px] text-[14px] leading-[19px] text-[#1a1c20]">{label}</span>
    {withIcon ? <CircleIcon size={18} /> : null}
  </button>
);

const SearchFilterSection = ({
  keyword,
  onKeywordChange,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
}) => (
  <section className="flex flex-col gap-[16px] bg-white px-[20px] py-[12px]">
    <div className="flex h-[56px] items-center gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
      <input
        type="search"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="빵집을 검색해보세요"
        className="flex-1 bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none"
      />
      <CircleIcon size={24} />
    </div>
    <div className="flex items-center gap-[8px]">
      <button
        type="button"
        className="flex max-h-[34px] items-center justify-center rounded-[9999px] bg-[#f3f4f5] p-[8px]"
      >
        <CircleIcon size={18} />
      </button>
      <FilterChip label="정렬" withIcon />
      <FilterChip label="영업 중" />
    </div>
  </section>
);

const BakeryMeta = ({
  rating,
  reviewCount,
  bookmarkCount,
}: Pick<BakeryRow, "rating" | "reviewCount" | "bookmarkCount">) => (
  <div className="flex h-[18px] items-center gap-[4px]">
    <div className="flex items-center gap-[2px]">
      <img src={ratingStar} alt="별점" className="h-[14px] w-[14px]" />
      <span className="text-[13px] leading-[18px] text-[#868b94]">{rating}</span>
      <span className="text-[13px] leading-[18px] text-[#868b94]">
        ({reviewCount.toLocaleString()})
      </span>
    </div>
    <span className="text-[13px] leading-[18px] text-[#868b94]">·</span>
    <div className="flex items-center gap-[2px]">
      <CircleIcon size={14} />
      <span className="text-[13px] leading-[18px] text-[#868b94]">{bookmarkCount}</span>
    </div>
  </div>
);

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
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
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

const BakeryCard = ({ bakery, onClick }: { bakery: BakeryRow; onClick?: () => void }) => (
  <article
    className="flex flex-col gap-[12px] border-b border-[#f3f4f5] px-[20px] py-[18px]"
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
  onItemClick,
}: {
  items: BakeryRow[];
  onItemClick?: (bakery: BakeryRow) => void;
}) => (
  <section className="flex flex-col">
    {items.map((bakery) => (
      <BakeryCard
        key={bakery.id}
        bakery={bakery}
        onClick={onItemClick ? () => onItemClick(bakery) : undefined}
      />
    ))}
  </section>
);

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

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-t border-[#eeeff1] px-[16px] py-[14px] pb-[max(14px,env(safe-area-inset-bottom))]"
      aria-label="페이지"
    >
      {Array.from({ length: totalPages }, (_, i) => {
        const isActive = i === currentPage;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelectPage(i)}
            className={cn(
              "flex h-[36px] min-w-[36px] items-center justify-center rounded-[10px] px-2 text-[15px] font-semibold transition-colors",
              isActive
                ? "bg-[#1a1c20] text-white"
                : "bg-[#f3f4f5] text-[#1a1c20] hover:bg-[#e8eaed]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {i + 1}
          </button>
        );
      })}
    </nav>
  );
}

type BbangteoBakeryListPageProps = {
  listEntryFrom?: BakeryListEntryFrom;
  /** 큐레이션 카드에 노출된 빵집 id 순서(첫 페이지 상단 고정) */
  curationPinIds?: number[];
};

const BbangteoBakeryListPage = ({ listEntryFrom, curationPinIds }: BbangteoBakeryListPageProps) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [fetchedPinRowsById, setFetchedPinRowsById] = useState<Map<number, BakeryRow>>(
    () => new Map(),
  );

  const pinIdsKey = (curationPinIds ?? []).join(",");
  const pins = useMemo(() => {
    if (!pinIdsKey) return [];
    return pinIdsKey
      .split(",")
      .map((segment) => Number.parseInt(segment.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [pinIdsKey]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    setPage(0);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const queryKeyword = keyword.trim() || undefined;
  const { data, loading, error } = useBakeries({
    page,
    size: PAGE_SIZE,
    sort: "RATING",
    open: false,
    keyword: queryKeyword,
  });

  const pinResolutionActive =
    page === 0 && queryKeyword == null && pins.length > 0 && Boolean(data?.bakeries?.length);

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
      if (row) {
        next.set(id, row);
      }
    }
    return next;
  }, [pinResolutionActive, pinIdsToFetch, fetchedPinRowsById]);

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
    if (!data?.bakeries?.length) return [];
    return data.bakeries.map(mapListItemToBakeryRow);
  }, [data]);

  const rows: BakeryRow[] = useMemo(() => {
    if (!apiRows.length) return [];
    const applyPins = page === 0 && !queryKeyword && pins.length > 0;
    if (!applyPins) {
      return apiRows;
    }

    const pinSet = new Set(pins);
    const pinnedOrdered: BakeryRow[] = [];
    for (const id of pins) {
      const fromList = apiRows.find((r) => r.id === id);
      const fetched = resolvedPinRowsById.get(id);
      const row = fromList ?? fetched;
      if (row) pinnedOrdered.push(row);
    }
    const tail = apiRows.filter((r) => !pinSet.has(r.id));
    return [...pinnedOrdered, ...tail].slice(0, PAGE_SIZE);
  }, [apiRows, page, queryKeyword, pins, resolvedPinRowsById]);

  const total = data?.total ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);

  const handleBakeryClick = (bakery: BakeryRow) => {
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: {
        bakeryId: bakery.id,
        from: listEntryFrom,
        courseId: undefined,
        reviewUploaded: undefined,
        reviewTab: undefined,
      },
    });
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <PageHeader title="빵집 리스트" listEntryFrom={listEntryFrom} />
        <main className="flex flex-1 flex-col pb-[56px] sm:pb-[60px]">
          <SearchFilterSection keyword={keyword} onKeywordChange={handleKeywordChange} />
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-[20px] py-[40px] text-[14px] text-[#868b94]">
              불러오는 중…
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center px-[20px] py-[40px] text-center text-[14px] text-[#868b94]">
              {error.message}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-[20px] py-[40px] text-[14px] text-[#868b94]">
              빵집이 없습니다.
            </div>
          ) : (
            <>
              <BakeryList items={rows} onItemClick={handleBakeryClick} />
              {totalPages > 0 ? (
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
