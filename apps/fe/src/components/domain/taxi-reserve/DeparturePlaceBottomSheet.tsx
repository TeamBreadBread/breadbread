import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { useKakaoPlaceSearch } from "@/hooks/useKakaoPlaceSearch";
import { getAccuratePosition } from "@/lib/getAccuratePosition";
import {
  isKakaoPlaceSearchConfigured,
  resolveCurrentLocationPlace,
  type KakaoSearchPlace,
} from "@/lib/kakaoPlaceSearch";
import { cn } from "@/utils/cn";
import {
  formatDeparturePlaceDisplay,
  formatDeparturePlaceWithCoords,
} from "@/utils/formatDeparturePlace";
import {
  loadDeparturePlaceRecents,
  pushDeparturePlaceRecent,
  saveDeparturePlaceRecents,
  type DepartureRecentEntry,
} from "@/utils/departurePlaceRecents";

export interface DeparturePlaceBottomSheetProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (place: string) => void;
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

export default function DeparturePlaceBottomSheet({
  open,
  onClose,
  onConfirm,
}: DeparturePlaceBottomSheetProps) {
  const [query, setQuery] = useState("");
  const [recentItems, setRecentItems] = useState<DepartureRecentEntry[]>(() =>
    loadDeparturePlaceRecents(),
  );
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const wasOpenRef = useRef(false);

  const refreshRecents = useCallback(() => {
    setRecentItems(loadDeparturePlaceRecents());
  }, []);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      queueMicrotask(() => {
        setQuery("");
        refreshRecents();
      });
    }
    wasOpenRef.current = open;
  }, [open, refreshRecents]);

  const queryTrimmed = query.trim();
  const {
    results: kakaoPlaces,
    loading: kakaoSearchLoading,
    error: kakaoSearchError,
  } = useKakaoPlaceSearch(query, open);
  const showKakaoSearch = queryTrimmed.length > 0 && isKakaoPlaceSearchConfigured();

  const filteredRecents = recentItems.filter((item) =>
    item.label.toLowerCase().includes(queryTrimmed.toLowerCase()),
  );

  const confirmDeparture = (label: string, coords: { lat: number; lng: number }) => {
    const place = formatDeparturePlaceWithCoords(label, coords);
    if (!place) return;

    onConfirm(place);
    setRecentItems((prev) => {
      const next = pushDeparturePlaceRecent(prev, { label, ...coords });
      saveDeparturePlaceRecents(next);
      return next;
    });
    onClose();
  };

  const confirmDepartureFromPlace = (place: KakaoSearchPlace) => {
    confirmDeparture(formatDeparturePlaceDisplay(place), { lat: place.lat, lng: place.lng });
  };

  const pickRecent = (entry: DepartureRecentEntry) => {
    confirmDeparture(entry.label, { lat: entry.lat, lng: entry.lng });
  };

  const removeRecent = (label: string, e: MouseEvent) => {
    e.stopPropagation();
    setRecentItems((prev) => {
      const next = prev.filter((item) => item.label !== label);
      saveDeparturePlaceRecents(next);
      return next;
    });
  };

  const submitSearch = () => {
    if (!queryTrimmed) return;
    window.alert("출발지는 아래 카카오 장소 검색 결과나 현재 위치에서 선택해 주세요.");
  };

  const useCurrentLocation = () => {
    setIsResolvingLocation(true);
    void (async () => {
      try {
        const { latitude, longitude, accuracy } = await getAccuratePosition();
        const place = await resolveCurrentLocationPlace(latitude, longitude);
        confirmDeparture(formatDeparturePlaceDisplay(place), {
          lat: place.lat,
          lng: place.lng,
        });

        if (accuracy !== null && accuracy > 120) {
          window.alert(
            `GPS 정확도가 약 ${Math.round(accuracy)}m입니다. PC·실내에서는 오차가 클 수 있어, 정확한 출발지는 검색으로 선택해 주세요.`,
          );
        }
      } catch {
        window.alert(
          "현재 위치를 가져오지 못했습니다. 브라우저 위치 권한을 허용했는지 확인하거나, 출발지를 직접 검색해 주세요.",
        );
      } finally {
        setIsResolvingLocation(false);
      }
    })();
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
                카카오 장소 검색으로 출발지를 선택해 주세요
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
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitSearch();
                      }
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

                {queryTrimmed.length > 0 ? (
                  <p className="px-[4px] font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#555d6d]">
                    엔터로 바로 확정되지 않습니다. 아래 카카오 장소 검색 결과에서 출발지를 선택해
                    주세요.
                  </p>
                ) : null}

                <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start">
                  <div className="flex w-full shrink-0 flex-row items-center justify-between border-b border-solid border-[#eeeff1] px-[10px] pb-[12px] pt-[20px]">
                    <div className="whitespace-nowrap font-['Pretendard',sans-serif] text-[13px] font-bold leading-[18px] text-[#555d6d]">
                      {showKakaoSearch ? "장소 검색" : "최근 검색"}
                    </div>
                    <button
                      type="button"
                      className="flex flex-row items-end justify-start gap-[4px] disabled:opacity-50"
                      disabled={isResolvingLocation}
                      onClick={useCurrentLocation}
                    >
                      <LocationPinGlyph />
                      <span className="whitespace-nowrap font-['Pretendard',sans-serif] text-[14px] font-medium leading-[19px] tracking-normal text-[#217cf9]">
                        {isResolvingLocation ? "위치 확인 중…" : "현재 위치"}
                      </span>
                    </button>
                  </div>

                  <div className="min-h-0 w-full flex-1 overflow-y-auto">
                    {filteredRecents.length === 0 && !showKakaoSearch ? (
                      <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                        최근 검색한 출발지가 여기에 표시됩니다.
                      </div>
                    ) : (
                      filteredRecents.map((item) => (
                        <div
                          key={item.label}
                          className="flex w-full cursor-pointer flex-row items-center justify-start gap-[4px] overflow-hidden bg-white px-[10px] py-[16px] hover:bg-[#f7f8f9]"
                          onClick={() => pickRecent(item)}
                        >
                          <HistoryGlyph />
                          <div className="min-w-0 flex-1 font-['Pretendard',sans-serif] text-[18px] leading-[24px] tracking-normal text-[#1a1c20]">
                            {item.label}
                          </div>
                          <button
                            type="button"
                            className="flex shrink-0 items-center justify-center p-0"
                            aria-label={`${item.label} 삭제`}
                            onClick={(e) => removeRecent(item.label, e)}
                          >
                            <RemoveRowGlyph />
                          </button>
                        </div>
                      ))
                    )}

                    {showKakaoSearch ? (
                      <>
                        {kakaoSearchLoading ? (
                          <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                            검색 중…
                          </div>
                        ) : null}
                        {kakaoSearchError ? (
                          <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-red-600">
                            {kakaoSearchError}
                          </div>
                        ) : null}
                        {!kakaoSearchLoading && !kakaoSearchError && kakaoPlaces.length === 0 ? (
                          <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                            검색 결과가 없습니다.
                          </div>
                        ) : null}
                        {kakaoPlaces.map((place) => (
                          <button
                            key={place.id}
                            type="button"
                            className="flex w-full cursor-pointer flex-col items-start justify-center gap-[4px] overflow-hidden border-b border-solid border-[#eeeff1] bg-white px-[10px] py-[16px] text-left last:border-b-0 hover:bg-[#f7f8f9]"
                            onClick={() => confirmDepartureFromPlace(place)}
                          >
                            <div className="flex w-full flex-row items-start justify-start gap-[8px]">
                              <SearchGlyph />
                              <span className="min-w-0 flex-1 font-['Pretendard',sans-serif] text-[18px] font-medium leading-[24px] tracking-normal text-[#1a1c20]">
                                {place.name}
                              </span>
                            </div>
                            {place.address ? (
                              <span className="pl-[32px] font-['Pretendard',sans-serif] text-[13px] leading-[18px] text-[#555d6d]">
                                {place.address}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </>
                    ) : queryTrimmed.length > 0 ? (
                      <div className="px-[10px] py-[16px] font-['Pretendard',sans-serif] text-[14px] leading-[19px] text-[#868b94]">
                        카카오 API 키를 설정하면 장소 검색을 사용할 수 있습니다.
                      </div>
                    ) : null}
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
