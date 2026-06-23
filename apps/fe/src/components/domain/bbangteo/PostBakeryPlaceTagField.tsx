import { useEffect, useId, useRef, useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import type { BakeryListItem } from "@/api/types/bakery";
import { useBakeryKeywordSearch } from "@/hooks/useBakeryKeywordSearch";
import { cn } from "@/utils/cn";

type PostBakeryPlaceTagFieldProps = {
  selectedBakery: Pick<BakeryListItem, "id" | "name"> | null;
  onSelect: (bakery: BakeryListItem) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
};

export default function PostBakeryPlaceTagField({
  selectedBakery,
  onSelect,
  onClear,
  disabled = false,
  className,
}: PostBakeryPlaceTagFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const trimmed = query.trim();
  const showSearchResults = isFocused && trimmed.length > 0 && selectedBakery == null && !disabled;
  const { results, loading, error } = useBakeryKeywordSearch(query, showSearchResults);

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
    onSelect(bakery);
    setIsFocused(false);
  };

  const handleClear = () => {
    onClear();
    setQuery("");
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (selectedBakery && value.trim() !== selectedBakery.name.trim()) {
      onClear();
    }
  };

  return (
    <div ref={rootRef} className={cn("flex flex-col gap-[8px]", className)}>
      <span className="text-[14px] leading-[19px] font-semibold text-[#1a1c20]">
        📍 방문 빵집 태그
      </span>

      {selectedBakery ? (
        <div className="flex items-center gap-[8px]">
          <span className="inline-flex items-center rounded-full border border-[#E8623A] bg-[#FFF0EB] px-[12px] py-[6px] text-[14px] font-semibold leading-[19px] text-[#1a1c20]">
            {selectedBakery.name}
          </span>
          {!disabled ? (
            <button
              type="button"
              className="text-[12px] font-medium leading-[17px] text-[#868b94] underline underline-offset-2"
              onClick={handleClear}
            >
              제거
            </button>
          ) : null}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="빵집 이름을 검색하세요"
            disabled={disabled}
            className="w-full rounded-[10px] border border-[#dcdee3] bg-white px-[14px] py-[10px] pr-[44px] text-[14px] leading-[19px] text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none disabled:opacity-50"
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
              className="absolute left-0 right-0 top-full z-20 mt-[4px] max-h-[min(240px,36vh)] overflow-y-auto rounded-[12px] border border-[#dcdee3] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
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
      )}
    </div>
  );
}
