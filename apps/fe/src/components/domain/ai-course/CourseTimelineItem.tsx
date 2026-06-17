import bestBreadIcon from "@/assets/icons/bestBreadIcon.svg";
import CongestionBadge from "@/components/common/CongestionBadge";
import { AppIcon, IconAssets } from "@/components/icons";
import { getCourseOrderBadgeBgClass } from "@/lib/courseOrderMarkerPalette";
import { cn } from "@/utils/cn";

interface CourseTimelineItemProps {
  index: number;
  place: import("./types").CoursePlace;
  onClick?: () => void;
  canReorder?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  reorderBusy?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export default function CourseTimelineItem({
  index,
  place,
  onClick,
  canReorder = false,
  canMoveUp = false,
  canMoveDown = false,
  reorderBusy = false,
  onMoveUp,
  onMoveDown,
}: CourseTimelineItemProps) {
  const clickableClass = onClick ? "cursor-pointer hover:bg-[#f0f3f7]" : "";
  const badgeBgClass = getCourseOrderBadgeBgClass(index);
  return (
    <div className="flex items-start gap-x1">
      <div className="flex items-center justify-start p-x2">
        <div className="relative h-x6 w-x6">
          <div className={cn("h-x6 w-x6 rounded-full", badgeBgClass)} />
          <div className="absolute inset-0 flex items-center justify-center font-pretendard typo-t2medium text-white">
            {index}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-start gap-x1">
        <button
          type="button"
          onClick={onClick}
          disabled={!onClick}
          className={`min-w-0 flex-1 rounded-r2 border border-[#f3f4f5] bg-[#f7f8f9] p-x4 text-left ${clickableClass}`}
        >
          <div className="flex flex-wrap items-center gap-x1">
            <div className="font-pretendard typo-t5bold text-[#1a1c20]">{place.name}</div>
            <CongestionBadge
              level={place.congestionLevel}
              expectedWaitMin={place.expectedWaitMin}
            />
          </div>

          <div className="mt-x1_5 flex flex-col gap-x1">
            <div className="flex items-start gap-x1">
              <AppIcon
                src={IconAssets.IcPin}
                size={14}
                color="gray-600"
                className="mt-[2px] shrink-0"
              />
              <span className="flex-1 font-pretendard typo-t3regular text-[#555d6d]">
                {place.address}
              </span>
            </div>
            {place.menu.trim() ? (
              <div className="flex items-start gap-x1">
                <img
                  src={bestBreadIcon}
                  alt=""
                  aria-hidden
                  className="icon-gray-600 h-x4 w-x4 shrink-0 object-contain"
                />
                <span className="flex-1 font-pretendard typo-t3regular text-[#555d6d]">
                  {place.menu}
                </span>
              </div>
            ) : null}
          </div>
        </button>

        {canReorder ? (
          <div className="flex shrink-0 flex-col gap-x1 pt-x1">
            <button
              type="button"
              aria-label={`${place.name} 순서 위로`}
              disabled={!canMoveUp || reorderBusy}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onMoveUp?.();
              }}
              className="flex h-x6 w-x6 items-center justify-center rounded-r2 border border-gray-200 bg-white text-[14px] text-gray-700 disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`${place.name} 순서 아래로`}
              disabled={!canMoveDown || reorderBusy}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onMoveDown?.();
              }}
              className="flex h-x6 w-x6 items-center justify-center rounded-r2 border border-gray-200 bg-white text-[14px] text-gray-700 disabled:opacity-40"
            >
              ↓
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
