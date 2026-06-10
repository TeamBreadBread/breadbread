import { cn } from "@/utils/cn";
import type { TrendStatus } from "@/types/trend";
import { formatTrendStatusLabel } from "@/utils/trendCuration";

type TrendStatusBadgeProps = {
  status?: TrendStatus | string | null;
  className?: string;
};

const STATUS_CLASS: Record<string, string> = {
  RISING: "bg-[#FFF0EB] text-[#E8623A]",
  STABLE: "bg-[var(--color-gray-200)] text-[var(--color-gray-700)]",
  FALLING: "bg-[#EEF3FF] text-[#4B6BFB]",
};

export default function TrendStatusBadge({ status, className }: TrendStatusBadgeProps) {
  const label = formatTrendStatusLabel(status);
  if (!label) return null;

  const normalized = typeof status === "string" ? status.toUpperCase() : "";
  const toneClass = STATUS_CLASS[normalized] ?? STATUS_CLASS.STABLE;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-[8px] py-[2px] text-[11px] font-semibold leading-[16px]",
        toneClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
