import TrendStatusBadge from "@/components/domain/trend/TrendStatusBadge";
import type { TrendingBread } from "@/types/trend";
import { cn } from "@/utils/cn";
import { formatTrendGrowthCaption, getTrendBreadEmoji } from "@/utils/trendCuration";

type TrendHotBreadCardProps = {
  bread: TrendingBread;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function TrendHotBreadCard({
  bread,
  compact = false,
  className,
  onClick,
  disabled = false,
}: TrendHotBreadCardProps) {
  const growthCaption = formatTrendGrowthCaption(bread.trendStatus, bread.growthRate);
  const breadEmoji = getTrendBreadEmoji(bread.keyword);

  const cardClassName = cn(
    "flex shrink-0 flex-col gap-[6px] rounded-[var(--radius-r3)] border border-[var(--color-gray-300)] bg-white text-left",
    compact ? "w-[132px] px-[12px] py-[10px]" : "w-[156px] px-[14px] py-[12px]",
    onClick && "cursor-pointer transition-opacity hover:border-[#E8623A]/40 active:opacity-80",
    disabled && "pointer-events-none opacity-60",
    className,
  );

  const content = (
    <>
      <div className="flex items-start gap-[4px]">
        <span className="text-[16px] leading-[20px]" aria-hidden>
          {breadEmoji}
        </span>
        <p className="line-clamp-2 flex-1 text-[14px] font-semibold leading-[19px] text-[var(--color-gray-1000)]">
          {bread.keyword}
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        {growthCaption ? (
          <p className="text-[12px] font-medium leading-[17px] text-[#E8623A]">{growthCaption}</p>
        ) : null}
        <TrendStatusBadge status={bread.trendStatus} />
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
