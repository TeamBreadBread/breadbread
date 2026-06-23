import type { BakeryTagType, BreadTagType } from "@/api/types/bakery";
import { cn } from "@/utils/cn";
import {
  formatBakeryTagLabel,
  formatBreadTagLabel,
  MAX_BAKERY_DETAIL_TAGS,
  MAX_BREAD_DETAIL_TAGS,
  normalizeBakeryTags,
  normalizeBreadTags,
} from "@/utils/bakeryTagLabels";

type BakeryTagBadgeRowProps = {
  tags?: BakeryTagType[] | null;
  className?: string;
  maxCount?: number;
};

export function BakeryTagBadgeRow({
  tags,
  className,
  maxCount = MAX_BAKERY_DETAIL_TAGS,
}: BakeryTagBadgeRowProps) {
  const visible = normalizeBakeryTags(tags).slice(0, maxCount);
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-[6px]", className)}>
      {visible.map((tag) => (
        <span
          key={tag}
          className="inline-flex shrink-0 items-center rounded-full bg-[#FFF0EB] px-[10px] py-[5px] text-[12px] leading-[16px] font-medium text-orange-700"
        >
          {formatBakeryTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}

type BreadTagBadgeRowProps = {
  tags?: BreadTagType[] | null;
  className?: string;
  maxCount?: number;
};

export function BreadTagBadgeRow({
  tags,
  className,
  maxCount = MAX_BREAD_DETAIL_TAGS,
}: BreadTagBadgeRowProps) {
  const visible = normalizeBreadTags(tags).slice(0, maxCount);
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-[6px]", className)}>
      {visible.map((tag) => (
        <span
          key={tag}
          className="inline-flex shrink-0 items-center text-[13px] leading-[18px] font-medium text-[#555d6d]"
        >
          #{formatBreadTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}
