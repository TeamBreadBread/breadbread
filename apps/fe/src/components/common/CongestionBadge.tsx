import { cn } from "@/utils/cn";
import { formatCongestionLevel, getCongestionBadgeClass } from "@/utils/congestionCheck";

type CongestionBadgeProps = {
  level?: string | null;
  expectedWaitMin?: number | null;
  className?: string;
};

export default function CongestionBadge({
  level,
  expectedWaitMin,
  className,
}: CongestionBadgeProps) {
  if (!level?.trim()) return null;

  const label = formatCongestionLevel(level);
  const waitLabel =
    expectedWaitMin != null && expectedWaitMin > 0 ? ` · 대기 ~${expectedWaitMin}분` : "";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-x2 py-[2px] font-pretendard text-[11px] font-semibold leading-[16px]",
        getCongestionBadgeClass(level),
        className,
      )}
    >
      {label}
      {waitLabel}
    </span>
  );
}
