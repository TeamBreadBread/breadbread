import { AppIcon, IconAssets } from "@/components/icons";
import { useState } from "react";

const categories = [
  { label: "지역별", icon: IconAssets.IcPin },
  { label: "종류별", icon: IconAssets.IcBread },
  { label: "에디터픽", icon: IconAssets.IcStar },
  { label: "테마별", icon: IconAssets.IcCompass },
] as const;

type Category = (typeof categories)[number]["label"];

const CategoryCard = ({
  label,
  icon,
  onClick,
}: {
  label: Category;
  icon: string;
  onClick?: (label: Category) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(label)}
      className="flex h-full w-full flex-col items-center justify-center gap-[2px] rounded-[8px] border border-[#f3f4f5] bg-[#f7f8f9] px-[20px] py-[12px]"
    >
      <AppIcon src={icon} size={36} className="opacity-70" />
      <span className="w-full text-center text-[12px] leading-[16px] font-medium text-[#2a3038]">
        {label}
      </span>
    </button>
  );
};

const SearchBox = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="flex h-[56px] shrink-0 items-center gap-x1-5 rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
      <input
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="빵집을 검색해보세요"
        className="flex-1 bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none"
      />
      <button type="button" aria-label="검색" className="flex shrink-0 items-center justify-center">
        <AppIcon src={IconAssets.IcSearch} size="x6" />
      </button>
    </div>
  );
};

type BbangteoSearchSectionProps = {
  onCategoryClick?: (label: Category) => void;
};

const BbangteoSearchSection = ({ onCategoryClick }: BbangteoSearchSectionProps) => {
  return (
    <section className="flex flex-col gap-[16px] bg-white px-[20px] py-[18px]">
      <SearchBox />
      <div className="flex h-[90px] shrink-0 items-start gap-[9px]">
        {categories.map((category) => (
          <CategoryCard
            key={category.label}
            label={category.label}
            icon={category.icon}
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </section>
  );
};

export default BbangteoSearchSection;
