import TrendStatusBadge from "@/components/domain/trend/TrendStatusBadge";
import type { TrendingBread } from "@/types/trend";
import { cn } from "@/utils/cn";
import { formatTrendGrowthCaption, formatTrendScore } from "@/utils/trendCuration";

type TrendHotBreadCardProps = {
  bread: TrendingBread;
  compact?: boolean;
  className?: string;
};

function trendEmoji(status: TrendingBread["trendStatus"]): string {
  switch (status) {
    case "RISING":
      return "🔥";
    case "FALLING":
      return "📉";
    default:
      return "🍞";
  }
}

export default function TrendHotBreadCard({
  bread,
  compact = false,
  className,
}: TrendHotBreadCardProps) {
  const growthCaption = formatTrendGrowthCaption(bread.trendStatus, bread.growthRate);
  const scoreLabel = formatTrendScore(bread.trendScore);

  return (
    <article
      className={cn(
        "flex shrink-0 flex-col gap-[6px] rounded-[var(--radius-r3)] border border-[var(--color-gray-300)] bg-white",
        compact ? "w-[132px] px-[12px] py-[10px]" : "w-[156px] px-[14px] py-[12px]",
        className,
      )}
    >
      <div className="flex items-start gap-[4px]">
        <span className="text-[16px] leading-[20px]" aria-hidden>
          {trendEmoji(bread.trendStatus)}
        </span>
        <p className="line-clamp-2 flex-1 text-[14px] font-semibold leading-[19px] text-[var(--color-gray-1000)]">
          {bread.keyword}
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        {growthCaption ? (
          <p className="text-[12px] font-medium leading-[17px] text-[#E8623A]">{growthCaption}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-[4px]">
          <TrendStatusBadge status={bread.trendStatus} />
          {scoreLabel ? (
            <span className="text-[11px] font-medium leading-[16px] text-[var(--color-gray-500)]">
              trendScore {scoreLabel}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
