import { useEffect, useId, useRef, useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import type { BakeryListItem } from "@/api/types/bakery";
import { useBakeryKeywordSearch } from "@/hooks/useBakeryKeywordSearch";
import { cn } from "@/utils/cn";

type BakerySuggestExistingSearchFieldProps = {
  value: string;
  selectedBakeryId: number | null;
  onValueChange: (value: string) => void;
  onBakerySelect: (bakery: BakeryListItem) => void;
  onClearSelection: () => void;
  inputClassName?: string;
};

export default function BakerySuggestExistingSearchField({
  value,
  selectedBakeryId,
  onValueChange,
  onBakerySelect,
  onClearSelection,
  inputClassName,
}: BakerySuggestExistingSearchFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const trimmed = value.trim();
  const showSearchResults = isFocused && trimmed.length > 0 && selectedBakeryId == null;

  const { results, loading, error } = useBakeryKeywordSearch(value, showSearchResults);

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

  const handleSelect = (bakery: BakeryListItem) => {
    onBakerySelect(bakery);
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
          placeholder="예) 성심당 본점"
          className={cn(inputClassName, "pr-[44px]")}
          maxLength={80}
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
                빵빵 등록 빵집
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
                등록된 빵집을 찾지 못했어요.
              </p>
            ) : null}

            {results.map((bakery) => (
              <button
                key={bakery.id}
                type="button"
                role="option"
                className="flex w-full flex-col gap-[2px] border-b border-[#f3f4f5] px-[14px] py-[12px] text-left last:border-b-0 active:bg-[#f7f8f9]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(bakery)}
              >
                <span className="text-[14px] font-semibold leading-[19px] text-[#1a1c20]">
                  {bakery.name}
                </span>
                {bakery.address ? (
                  <span className="text-[12px] leading-[17px] text-[#868b94]">
                    {bakery.address}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {trimmed.length > 0 && selectedBakeryId == null ? (
        <p className="text-[12px] leading-[17px] text-[#868b94]">
          수정할 빵집을 아래 검색 결과에서 선택해주세요.
        </p>
      ) : null}

      {selectedBakeryId != null ? (
        <button
          type="button"
          className="self-start text-[12px] font-medium leading-[17px] text-[#868b94] underline underline-offset-2"
          onClick={onClearSelection}
        >
          선택한 빵집 지우기
        </button>
      ) : null}
    </div>
  );
}
