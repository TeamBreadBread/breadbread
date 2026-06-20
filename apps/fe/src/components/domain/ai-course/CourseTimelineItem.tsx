import type { ReactNode } from "react";
import CongestionInfoTooltip from "@/components/domain/ai-course/CongestionInfoTooltip";
import { AppIcon, IconAssets } from "@/components/icons";
import { getCourseOrderBadgeBgClass } from "@/lib/courseOrderMarkerPalette";
import { formatCongestionTimelineLabel } from "@/utils/congestionCheck";
import { cn } from "@/utils/cn";

interface CourseTimelineItemProps {
  index: number;
  place: import("./types").CoursePlace;
  onClick?: () => void;
  canReorder?: boolean;
  reorderBusy?: boolean;
  dragHandle?: ReactNode;
}

function TimelineInfoRow({
  icon,
  iconColor,
  children,
}: {
  icon: string;
  iconColor?: "gray-600" | "orange-600";
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-x1">
      <AppIcon src={icon} size={14} color={iconColor ?? "gray-600"} className="mt-[2px] shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function CourseTimelineItem({
  index,
  place,
  onClick,
  canReorder = false,
  reorderBusy = false,
  dragHandle,
}: CourseTimelineItemProps) {
  const clickableClass = onClick ? "cursor-pointer hover:bg-[#fafbfc]" : "";
  const badgeBgClass = getCourseOrderBadgeBgClass(index);
  const recommendReason = place.recommendReason?.trim() ?? "";
  const menuLabel = place.menu.trim();
  const congestionLabel =
    place.congestionLabel?.trim() || formatCongestionTimelineLabel(place.congestionLevel);

  return (
    <div
      className={cn(
        "flex items-start gap-x1",
        canReorder && reorderBusy && "pointer-events-none opacity-70",
      )}
    >
      <div className="flex items-center justify-start p-x2">
        <div className="relative h-x6 w-x6">
          <div className={cn("h-x6 w-x6 rounded-full", badgeBgClass)} />
          <div className="absolute inset-0 flex items-center justify-center font-pretendard typo-t2medium text-white">
            {index}
          </div>
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={cn(
            "w-full rounded-r2 border border-[#eeeff1] bg-white p-x4 text-left shadow-[0_1px_2px_rgba(26,31,39,0.04)]",
            clickableClass,
            dragHandle && "pr-x10",
          )}
        >
          <div className="font-pretendard typo-t5bold text-[#1a1c20]">{place.name}</div>

          <div className="mt-x2 flex flex-col gap-x1_5">
            {recommendReason ? (
              <TimelineInfoRow icon={IconAssets.IcAi} iconColor="orange-600">
                <p className="line-clamp-2 font-pretendard typo-t3regular leading-t4 text-[#555d6d]">
                  {recommendReason}
                </p>
              </TimelineInfoRow>
            ) : null}

            {menuLabel ? (
              <TimelineInfoRow icon={IconAssets.IcBread}>
                <p className="font-pretendard typo-t3regular leading-t4 text-[#555d6d]">
                  {menuLabel}
                </p>
              </TimelineInfoRow>
            ) : null}

            <TimelineInfoRow icon={IconAssets.IcPersons}>
              <div className="flex flex-wrap items-center gap-x1">
                <span className="font-pretendard typo-t3regular leading-t4 text-[#555d6d]">
                  {congestionLabel}
                </span>
                <CongestionInfoTooltip />
              </div>
            </TimelineInfoRow>
          </div>
        </button>

        {dragHandle}
      </div>
    </div>
  );
}
