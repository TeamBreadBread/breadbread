import { Button } from "@/components";
import { cn } from "@/utils/cn";

export const RESULT_CTA_HEIGHT_CLASS = "pb-[calc(72px+env(safe-area-inset-bottom))]";

const actionButtonClass =
  "h-12 rounded-r2 text-size-3 leading-t4 font-bold tracking-2 transition-colors duration-150";

type ResultCTASectionProps = {
  onRetry?: () => void;
  onSave?: () => void;
};

export default function ResultCTASection({ onRetry, onSave }: ResultCTASectionProps) {
  const retryButtonClass = cn(
    actionButtonClass,
    "flex-1 bg-gray-300 text-gray-1000 hover:bg-gray-400",
  );

  const saveButtonClass = cn(
    actionButtonClass,
    "flex-1 bg-gray-800 text-gray-00 hover:bg-gray-900",
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-20">
      <div className="mx-auto max-w-[744px] bg-gray-00">
        <div className="flex gap-x2 border-t border-gray-300 px-x5 py-x3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <Button type="button" className={retryButtonClass} onClick={onRetry}>
            다시 추천받기
          </Button>

          <Button type="button" className={saveButtonClass} onClick={onSave}>
            코스 저장하기
          </Button>
        </div>
      </div>
    </div>
  );
}
