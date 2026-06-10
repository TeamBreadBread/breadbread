import { cn } from "@/utils/cn";
import type { TrendBread } from "@/types/trend";
import TrendStatusBadge from "@/components/domain/trend/TrendStatusBadge";
import { formatTrendScore } from "@/utils/trendCuration";

type TrendKeywordChipProps = {
  bread: TrendBread;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function TrendKeywordChip({
  bread,
  selected = false,
  onClick,
  className,
}: TrendKeywordChipProps) {
  const scoreLabel = formatTrendScore(bread.trendScore);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-[6px] rounded-full border px-[14px] py-[8px] transition-colors",
        selected
          ? "border-[#E8623A] bg-[#FFF0EB] text-[var(--color-gray-1000)]"
          : "border-[var(--color-gray-300)] bg-white text-[var(--color-gray-900)]",
        className,
      )}
    >
      <span className="text-[14px] font-semibold leading-[19px]">{bread.keyword}</span>
      <TrendStatusBadge status={bread.trendStatus} />
      {scoreLabel ? (
        <span className="text-[11px] font-medium leading-[16px] text-[var(--color-gray-500)]">
          {scoreLabel}
        </span>
      ) : null}
    </button>
  );
}
