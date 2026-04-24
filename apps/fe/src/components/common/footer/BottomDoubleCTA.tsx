import { Button } from "@/components/common/Button";
import { cn } from "@/utils/cn";

interface BottomDoubleCTAProps {
  leftText: string;
  rightText: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

export default function BottomDoubleCTA({
  leftText,
  rightText,
  onLeftClick,
  onRightClick,
}: BottomDoubleCTAProps) {
  const actionButtonClass = cn(
    "h-14 flex-1 rounded-r2 text-size-5 leading-t6 font-bold tracking-2 transition-colors duration-150",
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-x3">
      <div className="mx-auto max-w-[744px] bg-gray-00">
        <div className="flex gap-x2 border-t border-gray-300 px-x5 py-x3">
          <Button
            className={cn(actionButtonClass, "bg-gray-300 text-gray-1000 hover:bg-gray-400")}
            onClick={onLeftClick}
          >
            {leftText}
          </Button>
          <Button
            className={cn(actionButtonClass, "bg-gray-800 text-gray-00 hover:bg-gray-900")}
            onClick={onRightClick}
          >
            {rightText}
          </Button>
        </div>
      </div>
    </div>
  );
}
