import { useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import BreadBtiEntryBanner from "@/components/domain/breadbti/BreadBtiEntryBanner";
import {
  QUICK_MENU_CATEGORIES,
  type QuickMenuCategoryLabel,
} from "@/components/domain/home/quickMenuCategories";

const CategoryCard = ({
  label,
  imageSrc,
  onClick,
}: {
  label: QuickMenuCategoryLabel;
  imageSrc: string;
  onClick?: (label: QuickMenuCategoryLabel) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(label)}
      className="flex h-full w-full flex-col items-center justify-center gap-x1-5 rounded-[8px] bg-[#f7f8f9] px-[20px] py-[12px]"
    >
      <img src={imageSrc} alt="" aria-hidden className="h-[44px] w-[44px] object-contain" />
      <span className="w-full text-center text-[12px] leading-[16px] font-medium text-[#2a3038]">
        {label}
      </span>
    </button>
  );
};

type SearchBoxProps = {
  onSearch?: (keyword: string) => void;
};

const SearchBox = ({ onSearch }: SearchBoxProps) => {
  const [searchText, setSearchText] = useState("");

  const submit = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    onSearch?.(trimmed);
  };

  const clear = () => {
    setSearchText("");
  };

  return (
    <div className="flex h-[56px] shrink-0 items-center gap-x1-5 rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
      <input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="빵집을 검색해보세요"
        className="min-w-0 flex-1 bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none"
      />
      {searchText.length > 0 ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={clear}
          className="flex shrink-0 items-center justify-center"
        >
          <AppIcon src={IconAssets.IcClose} size="x5" className="opacity-45" alt="" />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="검색"
        onClick={submit}
        className="flex shrink-0 items-center justify-center"
      >
        <AppIcon src={IconAssets.IcSearch} size="x6" />
      </button>
    </div>
  );
};

type BbangteoSearchSectionProps = {
  onCategoryClick?: (label: QuickMenuCategoryLabel) => void;
  onSearch?: (keyword: string) => void;
};

const BbangteoSearchSection = ({ onCategoryClick, onSearch }: BbangteoSearchSectionProps) => {
  return (
    <section className="flex flex-col gap-[16px] bg-white px-[20px] py-[18px]">
      <SearchBox onSearch={onSearch} />
      <div className="flex h-[90px] shrink-0 items-start gap-[9px]">
        {QUICK_MENU_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.label}
            label={category.label}
            imageSrc={category.imageSrc}
            onClick={onCategoryClick}
          />
        ))}
      </div>
      <BreadBtiEntryBanner />
    </section>
  );
};

export default BbangteoSearchSection;
