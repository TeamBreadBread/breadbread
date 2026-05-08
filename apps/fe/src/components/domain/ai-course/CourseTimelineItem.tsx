import mapIcon from "@/assets/icons/mapIcon.svg";
import bestBreadIcon from "@/assets/icons/bestBreadIcon.svg";

interface CourseTimelineItemProps {
  index: number;
  place: import("./types").CoursePlace;
  onClick?: () => void;
}

export default function CourseTimelineItem({ index, place, onClick }: CourseTimelineItemProps) {
  const clickableClass = onClick ? "cursor-pointer hover:bg-[#f0f3f7]" : "";
  return (
    <div className="flex items-start gap-x1">
      <div className="flex items-center justify-start p-x2">
        <div className="relative h-x6 w-x6">
          <div className="h-x6 w-x6 rounded-full bg-[#868b94]" />
          <div className="absolute inset-0 flex items-center justify-center font-pretendard typo-t2medium text-white">
            {index}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`flex-1 rounded-r2 border border-[#f3f4f5] bg-[#f7f8f9] p-x4 text-left ${clickableClass}`}
      >
        <div className="font-pretendard typo-t5bold text-[#1a1c20]">{place.name}</div>

        <div className="mt-x1_5 flex flex-col gap-x1">
          <div className="flex items-start gap-x1">
            <img
              src={mapIcon}
              alt=""
              aria-hidden
              className="mt-[2px] h-[14px] w-[12px] shrink-0 object-contain"
            />
            <span className="flex-1 font-pretendard typo-t3regular text-[#555d6d]">
              {place.address}
            </span>
          </div>
          <div className="flex items-start gap-x1">
            <img
              src={bestBreadIcon}
              alt=""
              aria-hidden
              className="h-x4 w-x4 shrink-0 object-contain"
            />
            <span className="flex-1 font-pretendard typo-t3regular text-[#555d6d]">
              {place.menu}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
