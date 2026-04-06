import { cn } from "@/utils/cn";
import numberBreadIcon from "@/assets/icons/numberBread.svg";

interface CourseTimelineItemProps {
  index: number;
  name: string;
  address: string;
  menu: string;
  isLast?: boolean;
}

export default function CourseTimelineItem({
  index,
  name,
  address,
  menu,
  isLast = false,
}: CourseTimelineItemProps) {
  const badgeContainerClass = cn("relative z-10 flex", "w-9 justify-center", "pt-x1");

  const badgeClass = cn(
    "relative flex h-6 w-6 items-center justify-center",
    "text-size-1 leading-t2 font-bold tracking-1",
    "text-gray-00",
  );

  const timelineCardClass = cn(
    "flex flex-1 flex-col gap-x1",
    "rounded-r2 border border-gray-200 bg-gray-100",
    "p-x4 pb-x4",
  );

  const connectorLineClass = cn(
    "absolute w-[2px] bg-gray-200",
    "left-[17px] top-[30px]",
    "h-[calc(100%-12px)]",
  );

  return (
    <div className="relative flex gap-x2">
      <div className={badgeContainerClass}>
        <div className={badgeClass}>
          <img src={numberBreadIcon} alt="" className="h-full w-full" aria-hidden />
          <span className="absolute inset-0 flex items-center justify-center">{index}</span>
        </div>
      </div>

      {!isLast && <div className={connectorLineClass} aria-hidden />}

      <div className={timelineCardClass}>
        <div className="text-size-4 leading-t5 font-bold tracking-2 text-gray-1000">{name}</div>

        <div className="flex flex-col gap-x1 text-size-2 leading-t3 font-regular tracking-0 text-gray-800">
          <span>{address}</span>
          <span>{menu}</span>
        </div>
      </div>
    </div>
  );
}
