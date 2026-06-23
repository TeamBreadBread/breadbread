import HorizontalScrollArea from "@/components/common/HorizontalScrollArea";
import { cn } from "@/utils/cn";
import type { TrendBread } from "@/types/trend";

type TrendBreadCategoryTabBarProps = {
  breads: TrendBread[];
  selectedKeyword: string;
  onSelect: (keyword: string) => void;
  className?: string;
};

export default function TrendBreadCategoryTabBar({
  breads,
  selectedKeyword,
  onSelect,
  className,
}: TrendBreadCategoryTabBarProps) {
  const activeKeyword = selectedKeyword.trim();

  if (breads.length === 0) {
    return null;
  }

  return (
    <HorizontalScrollArea aria-label="SNS 트렌드 빵 카테고리" className={className}>
      <div className="flex w-max gap-[8px] px-[20px] pb-[12px]">
        {breads.map((bread) => {
          const keyword = bread.keyword.trim();
          const selected = keyword === activeKeyword;
          return (
            <button
              key={keyword}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(keyword)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-[14px] py-[8px] text-[14px] font-semibold leading-[19px] transition-colors",
                selected
                  ? "border-[#E8623A] bg-[#FFF0EB] text-[#1a1c20]"
                  : "border-[#dcdee3] bg-white text-[#4d5159]",
              )}
            >
              {keyword}
            </button>
          );
        })}
      </div>
    </HorizontalScrollArea>
  );
}
