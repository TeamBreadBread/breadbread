import type { MouseEvent } from "react";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BakeryListItem } from "@/api/types/bakery";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { useBakeries } from "@/hooks/useBakeries";
import { cn } from "@/utils/cn";
import { formatCurationAddress } from "@/utils/formatCurationAddress";

export interface DeparturePlaceBottomSheetProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (place: string) => void;
}

const STORAGE_KEY = "taxiReserveDepartureRecent";

function formatPlaceFromBakery(bakery: BakeryListItem): string {
  const name = bakery.name.trim();
  const addr = bakery.address?.trim() ?? "";
  const lat = bakery.lat;
  const lng = bakery.lng;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    const label = addr ? `${name} · ${addr}` : name;
    return `${label} (${lat}, ${lng})`;
  }
  return addr ? `${name} · ${addr}` : name;
}

function CloseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M8 8l12 12M20 8L8 20" stroke="#1a1c20" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="#555D6D" strokeWidth="1.6" />
      <path d="M15 15l5.2 5.2" stroke="#555D6D" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HistoryGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="#555D6D" strokeWidth="1.5" />
      <path d="M12 8v4.25l2.75 1.5" stroke="#555D6D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function RemoveRowGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 8l8 8M16 8l-8 8" stroke="#868b94" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LocationPinGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6.5-4.2 6.5-9.5A6.5 6.5 0 1 0 5.5 11.5C5.5 16.8 12 21 12 21Z"
        stroke="#217cf9"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2" fill="#217cf9" />
    </svg>
  );
}

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

function saveRecents(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

function pushRecent(items: string[], place: string): string[] {
  const t = place.trim();
  if (!t) return items;
  const without = items.filter((x) => x !== t);
  return [t, ...without];
}

export default function DeparturePlaceBottomSheet({
  open,
  onClose,
  onConfirm,
}: DeparturePlaceBottomSheetProps) {
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recentItems, setRecentItems] = useState<string[]>(() => loadRecents());
  const wasOpenRef = useRef(false);
  const deferredSearchKeyword = useDeferredValue(query);

  const refreshRecents = useCallback(() => {
    setRecentItems(loadRecents());
  }, []);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      queueMicrotask(() => {
        setQuery("");
        setDebouncedSearch("");
        refreshRecents();
      });
    }
    wasOpenRef.current = open;
  }, [open, refreshRecents]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setDebouncedSearch(deferredSearchKeyword.trim()), 300);
    return () => window.clearTimeout(id);
  }, [deferredSearchKeyword, open]);

  const trimmedSearch = debouncedSearch.trim();
  const searchQuery = trimmedSearch.length >= 2 ? trimmedSearch : "";

  const {
    data: bakerySearchData,
    loading: bakerySearchLoading,
    error: bakerySearchError,
  } = useBakeries(
    {
      page: 0,
      size: 20,
      sort: "RATING",
      open: false,
      keyword: searchQuery || undefined,
    },
    { enabled: open && searchQuery.length > 0 },
  );

  const bakeryResults: BakeryListItem[] = bakerySearchData?.bakeries ?? [];
  const listTitle = searchQuery.length > 0 ? "검색 결과" : "최근 검색어";

  const filtered = recentItems.filter((item) =>
    item.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pickPlace = (place: string) => {
    const t = place.trim();
    if (!t) return;
    onConfirm(t);
    setRecentItems((prev) => {
      const next = pushRecent(prev, t);
      saveRecents(next);
      return next;
    });
    onClose();
  };

  const pickBakery = (bakery: BakeryListItem) => {
    pickPlace(formatPlaceFromBakery(bakery));
  };

  const removeRecent = (item: string, e: MouseEvent) => {
    e.stopPropagation();
    setRecentItems((prev) => {
      const next = prev.filter((x) => x !== item);
      saveRecents(next);
      return next;
    });
  };

  const submitSearch = () => {
    const t = query.trim();
    if (!t) return;
    pickPlace(t);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      pickPlace("현재 위치");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        pickPlace(`현재 위치 (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      },
      () => {
        pickPlace("현재 위치");
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  if (!open) return null;

  const sheet = (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="바텀시트 닫기"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-end justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="departure-place-sheet-title"
          className={cn(
            "pointer-events-auto flex max-h-[min(90vh,780px)] flex-col items-start justify-start gap-[16px] overflow-hidden rounded-tl-[24px] rounded-tr-[24px] bg-white",
            RESPONSIVE_FRAME_WIDTH,
          )}
        >
          <button
            type="button"
            className="relative flex h-[24px] w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-white"
            onClick={onClose}
            aria-label="닫기"
          >
            <span className="h-[4px] w-[36px] shrink-0 rounded-[9999px] bg-[#dcdee3]" aria-hidden />
          </button>

          <div className="relative flex w-full shrink-0 flex-row items-start justify-between px-[20px] py-0">
            <div className="flex flex-1 flex-col items-center justify-start gap-[6px]">
              <div
                id="departure-place-sheet-title"
                className="w-full text-left font-['Pretendard',sans-serif] text-[20px] font-bold leading-[27px] tracking-normal text-[#1a1c20]"
              >
                출발 장소
              </div>
              <div className="w-full text-left font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#555d6d]">
                빵집을 검색해 출발 장소를 선택해 주세요
              </div>
            </div>
            <button
              type="button"
              className="absolute right-[20px] top-0 flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden"
              onClick={onClose}
              aria-label="닫기"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-row items-start justify-start px-[20px] py-0">
            <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start">
              <div className="flex h-[min(592px,calc(90vh-200px))] min-h-[320px] w-full shrink-0 flex-col items-start justify-start gap-[10px] overflow-hidden bg-white">
                <div className="flex h-[56px] w-full shrink-0 flex-row items-center justify-start gap-[8px] overflow-hidden rounded-[12px] border border-solid border-[#dcdee3] px-[20px] py-[16px]">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitSearch();
                    }}
                    placeholder="빵집 이름이나 동네를 입력해보세요"
                    className="min-w-0 flex-1 bg-transparent font-['Pretendard',sans-serif] text-[16px] leading-[22px] tracking-normal text-[#1a1c20] outline-none placeholder:text-[#d1d3d8]"
                  />
                  <button
                    type="button"
                    className="flex shrink-0 flex-row items-center justify-center self-stretch overflow-hidden"
                    aria-label="검색"
                    onClick={submitSearch}
                  >
                    <SearchGlyph />
                  </button>
                </div>

                <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start">
                  <div className="flex w-full shrink-0 flex-row items-center justify-between border-b border-solid border-[#eeeff1] px-[10px] pb-[12px] pt-[20px]">
                    <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] font-bold leading-[18px] text-[#555d6d]">
                      {listTitle}
                    </div>
                    <button
                      type="button"
                      className="flex flex-row items-end justify-start gap-[4px]"
                      onClick={useCurrentLocation}
                    >
                      <LocationPinGlyph />
                      <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] leading-[19px] tracking-normal text-[#217cf9]">
                        현재 위치
                      </span>
                    </button>
                  </div>
                  <div className="min-h-0 w-full flex-1 overflow-y-auto">
                    {searchQuery.length > 0 ? (
                      bakerySearchLoading ? (
                        <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                          검색 중…
                        </div>
                      ) : bakerySearchError ? (
                        <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-red-600">
                          {bakerySearchError.message}
                        </div>
                      ) : bakeryResults.length === 0 ? (
                        <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                          검색 결과가 없습니다.
                        </div>
                      ) : (
                        bakeryResults.map((bakery) => {
                          const addr = bakery.address?.trim()
                            ? formatCurationAddress(bakery.address.trim())
                            : "";
                          return (
                            <button
                              key={bakery.id}
                              type="button"
                              className="flex w-full cursor-pointer flex-col items-start justify-center gap-[4px] overflow-hidden border-b border-solid border-[#eeeff1] bg-white px-[10px] py-[16px] text-left last:border-b-0 hover:bg-[#f7f8f9]"
                              onClick={() => pickBakery(bakery)}
                            >
                              <div className="flex w-full flex-row items-start justify-start gap-[8px]">
                                <SearchGlyph />
                                <span className="min-w-0 flex-1 font-['Pretendard',sans-serif] text-[18px] font-medium leading-[24px] tracking-normal text-[#1a1c20]">
                                  {bakery.name}
                                </span>
                              </div>
                              {addr ? (
                                <span className="pl-[32px] font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#555d6d]">
                                  {addr}
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      )
                    ) : query.trim().length > 0 ? (
                      <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                        두 글자 이상 입력해 주세요.
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                        이름이나 동네를 입력하면 빵집을 찾아드려요.
                      </div>
                    ) : (
                      filtered.map((item) => (
                        <div
                          key={item}
                          className="flex w-full cursor-pointer flex-row items-center justify-start gap-[4px] overflow-hidden bg-white px-[10px] py-[16px] hover:bg-[#f7f8f9]"
                          onClick={() => pickPlace(item)}
                        >
                          <HistoryGlyph />
                          <div className="min-w-0 flex-1 font-['Pretendard',sans-serif] text-[18px] leading-[24px] tracking-normal text-[#1a1c20]">
                            {item}
                          </div>
                          <button
                            type="button"
                            className="flex shrink-0 items-center justify-center p-0"
                            aria-label={`${item} 삭제`}
                            onClick={(e) => removeRecent(item, e)}
                          >
                            <RemoveRowGlyph />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col items-start justify-start">
            <div className="h-[33px] w-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
