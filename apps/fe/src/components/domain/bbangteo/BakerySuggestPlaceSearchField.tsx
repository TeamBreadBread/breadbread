import { useEffect, useId, useRef, useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { useKakaoPlaceSearch } from "@/hooks/useKakaoPlaceSearch";
import { isKakaoPlaceSearchConfigured, type KakaoSearchPlace } from "@/lib/kakaoPlaceSearch";
import { cn } from "@/utils/cn";
import { searchInputPaddingClass } from "@/components/domain/bbangteo/SearchInputWithIcon";
import { extractDong, extractDongFromRoad } from "@/utils/formatCurationAddress";

export type BakerySuggestPlaceSelection = {
  bakeryName: string;
  address: string;
  dong: string;
  lat: number;
  lng: number;
  placeId: string;
};

type BakerySuggestPlaceSearchFieldProps = {
  variant?: "place" | "address";
  value: string;
  selectedPlaceId: string | null;
  onValueChange: (value: string) => void;
  onPlaceSelect: (selection: BakerySuggestPlaceSelection) => void;
  onClearSelection: () => void;
  inputClassName?: string;
  placeholder?: string;
  hintText?: string;
  clearLabel?: string;
  listHeaderLabel?: string;
  maxLength?: number;
};

const VARIANT_DEFAULTS = {
  place: {
    placeholder: "빵집 이름이나 주소를 검색해보세요",
    hintText: "아래 카카오 장소 검색 결과에서 선택하면 이름·주소·동이 자동으로 채워져요.",
    clearLabel: "선택한 장소 지우기",
    listHeaderLabel: "장소 검색",
    maxLength: 80,
  },
  address: {
    placeholder: "빵집 이름이나 주소를 검색해보세요",
    hintText: "아래 카카오 장소 검색 결과에서 선택하면 주소가 자동으로 채워져요.",
    clearLabel: "선택한 주소 지우기",
    listHeaderLabel: "장소 검색",
    maxLength: 200,
  },
} as const;

export default function BakerySuggestPlaceSearchField({
  variant = "place",
  value,
  selectedPlaceId,
  onValueChange,
  onPlaceSelect,
  onClearSelection,
  inputClassName,
  placeholder,
  hintText,
  clearLabel,
  listHeaderLabel,
  maxLength,
}: BakerySuggestPlaceSearchFieldProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const resolvedPlaceholder = placeholder ?? defaults.placeholder;
  const resolvedHintText = hintText ?? defaults.hintText;
  const resolvedClearLabel = clearLabel ?? defaults.clearLabel;
  const resolvedListHeaderLabel = listHeaderLabel ?? defaults.listHeaderLabel;
  const resolvedMaxLength = maxLength ?? defaults.maxLength;
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const kakaoConfigured = isKakaoPlaceSearchConfigured();
  const trimmed = value.trim();
  const showSearchResults =
    kakaoConfigured && isFocused && trimmed.length > 0 && selectedPlaceId == null;

  const { results, loading, error } = useKakaoPlaceSearch(value, showSearchResults);

  useEffect(() => {
    if (!showSearchResults) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showSearchResults]);

  const handleSelect = (place: KakaoSearchPlace) => {
    onPlaceSelect(toPlaceSelection(place));
    setIsFocused(false);
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-[8px]">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={resolvedPlaceholder}
          className={cn(inputClassName, searchInputPaddingClass)}
          maxLength={resolvedMaxLength}
          role="combobox"
          aria-expanded={showSearchResults}
          aria-controls={showSearchResults ? listboxId : undefined}
          aria-autocomplete="list"
        />
        <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2">
          <AppIcon src={IconAssets.IcSearch} size="x6" alt="" className="opacity-50" />
        </span>

        {showSearchResults ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-[4px] max-h-[min(280px,40vh)] overflow-y-auto rounded-[12px] border border-[#dcdee3] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="sticky top-0 border-b border-[#f3f4f5] bg-white px-[14px] py-[10px]">
              <span className="text-[12px] font-semibold leading-[16px] text-[#868b94]">
                {resolvedListHeaderLabel}
              </span>
            </div>

            {loading ? (
              <p className="px-[14px] py-[12px] text-[14px] leading-[19px] text-[#868b94]">
                검색 중…
              </p>
            ) : null}

            {error ? (
              <p className="px-[14px] py-[12px] text-[14px] leading-[19px] text-[#E8623A]">
                {error}
              </p>
            ) : null}

            {!loading && !error && results.length === 0 ? (
              <p className="px-[14px] py-[12px] text-[14px] leading-[19px] text-[#868b94]">
                검색 결과가 없습니다.
              </p>
            ) : null}

            {results.map((place) => (
              <button
                key={place.id}
                type="button"
                role="option"
                className="flex w-full flex-col gap-[2px] border-b border-[#f3f4f5] px-[14px] py-[12px] text-left last:border-b-0 active:bg-[#f7f8f9]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(place)}
              >
                <span className="text-[14px] font-semibold leading-[19px] text-[#1a1c20]">
                  {place.name}
                </span>
                {place.address ? (
                  <span className="text-[12px] leading-[17px] text-[#868b94]">{place.address}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {kakaoConfigured && trimmed.length > 0 && selectedPlaceId == null ? (
        <p className="text-[12px] leading-[17px] text-[#868b94]">{resolvedHintText}</p>
      ) : null}

      {selectedPlaceId != null ? (
        <button
          type="button"
          className="self-start text-[12px] font-medium leading-[17px] text-[#868b94] underline underline-offset-2"
          onClick={onClearSelection}
        >
          {resolvedClearLabel}
        </button>
      ) : null}
    </div>
  );
}

function resolveDongFromAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return "";
  return extractDong(trimmed) ?? extractDongFromRoad(trimmed) ?? "";
}

function toPlaceSelection(place: KakaoSearchPlace): BakerySuggestPlaceSelection {
  return {
    bakeryName: place.name.trim(),
    address: place.address.trim(),
    dong: resolveDongFromAddress(place.address),
    lat: place.lat,
    lng: place.lng,
    placeId: place.id,
  };
}
