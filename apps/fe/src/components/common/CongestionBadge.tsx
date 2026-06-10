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
        // self-start w-fit: flex-col 부모에서 가로로 늘어나지 않고 텍스트 길이에 맞춤
        "inline-flex w-fit items-center self-start rounded-full px-x2 py-[2px] font-pretendard text-[11px] font-semibold leading-[16px]",
        getCongestionBadgeClass(level),
        className,
      )}
    >
      {label}
      {waitLabel}
    </span>
  );
}
