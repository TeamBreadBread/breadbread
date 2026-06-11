import type { TrendingBread } from "@/types/trend";
import { cn } from "@/utils/cn";
import {
  formatGrowthRate,
  getTrendBreadEmoji,
  getTrendBreadMedalEmoji,
  type TrendBreadMedalRank,
} from "@/utils/trendCuration";

type TrendHotBreadCardProps = {
  bread: TrendingBread;
  compact?: boolean;
  medalRank?: TrendBreadMedalRank;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const GROWTH_BADGE_CLASS: Record<string, string> = {
  RISING: "bg-[#FFF0EB] text-[#E8623A]",
  STABLE: "bg-[var(--color-gray-200)] text-[var(--color-gray-700)]",
  FALLING: "bg-[#EEF3FF] text-[#4B6BFB]",
};

function getGrowthBadgeClass(status: TrendingBread["trendStatus"]): string {
  const normalized = typeof status === "string" ? status.toUpperCase() : "";
  return GROWTH_BADGE_CLASS[normalized] ?? GROWTH_BADGE_CLASS.STABLE;
}

export default function TrendHotBreadCard({
  bread,
  compact = false,
  medalRank,
  className,
  onClick,
  disabled = false,
}: TrendHotBreadCardProps) {
  const breadEmoji = getTrendBreadEmoji(bread.keyword);
  const growthLabel = formatGrowthRate(bread.growthRate);
  const hasMedal = medalRank != null;

  const cardClassName = cn(
    "relative flex shrink-0 flex-col gap-[6px] rounded-[var(--radius-r3)] border border-[var(--color-gray-300)] bg-white text-left",
    compact
      ? "min-h-[88px] w-[132px] px-[12px] py-[10px] pt-[26px]"
      : "min-h-[96px] w-[156px] px-[14px] py-[12px] pt-[28px]",
    onClick && "cursor-pointer transition-opacity hover:border-[#E8623A]/40 active:opacity-80",
    disabled && "pointer-events-none opacity-60",
    className,
  );

  const content = (
    <>
      <span
        className="absolute left-[8px] top-[8px] text-[14px] leading-none"
        aria-hidden={!hasMedal}
        aria-label={hasMedal ? `핫한 빵 ${medalRank}위` : undefined}
      >
        {hasMedal ? getTrendBreadMedalEmoji(medalRank) : null}
      </span>

      <div className="flex items-start gap-[4px]">
        <span className="text-[16px] leading-[20px]" aria-hidden>
          {breadEmoji}
        </span>
        <p className="line-clamp-2 flex-1 text-[14px] font-semibold leading-[19px] text-[var(--color-gray-1000)]">
          {bread.keyword}
        </p>
      </div>

      <div className="min-h-[18px]">
        {growthLabel ? (
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-[6px] py-[2px] text-[10px] font-semibold leading-[14px]",
              getGrowthBadgeClass(bread.trendStatus),
            )}
          >
            {growthLabel}
          </span>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={cardClassName}>
        {content}
      </button>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
