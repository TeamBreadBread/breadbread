import { useState } from "react";

const categories = ["지역별", "종류별", "에디터픽", "테마별"] as const;
type Category = (typeof categories)[number];

const CircleIcon = ({ size, color }: { size: number; color: string }) => {
  return (
    <div className="flex items-center justify-center p-[3px]">
      <div
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </div>
  );
};

const CategoryCard = ({
  label,
  onClick,
}: {
  label: Category;
  onClick?: (label: Category) => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(label)}
      className="flex h-full w-full flex-col items-center justify-center gap-[2px] rounded-[8px] border border-[#f3f4f5] bg-[#f7f8f9] px-[20px] py-[12px]"
    >
      <CircleIcon size={36} color="#dcdee3" />
      <span className="w-full text-center text-[12px] leading-[16px] font-medium text-[#2a3038]">
        {label}
      </span>
    </button>
  );
};

const SearchBox = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <div className="flex h-[56px] shrink-0 items-center gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
      <input
        type="search"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="빵집을 검색해보세요"
        className="flex-1 bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none"
      />
      <button
        type="button"
        aria-label="검색"
        className="h-[24px] w-[24px] rounded-full bg-[#dcdee3]"
      />
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
          <CategoryCard key={category} label={category} onClick={onCategoryClick} />
        ))}
      </div>
    </section>
  );
};

export default BbangteoSearchSection;
