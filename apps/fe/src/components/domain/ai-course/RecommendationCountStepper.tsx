import { cn } from "@/utils/cn";

interface RecommendationCountStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

const controlButtonClassName = cn(
  "flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-r1 bg-gray-100",
  "font-sans text-size-6 leading-none font-medium text-gray-1000",
  "transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
  "sm:size-11",
);

export default function RecommendationCountStepper({
  value,
  min = 1,
  max = 5,
  onChange,
}: RecommendationCountStepperProps) {
  const handleDecrease = () => {
    onChange(Math.max(min, value - 1));
  };

  const handleIncrease = () => {
    onChange(Math.min(max, value + 1));
  };

  const isDecreaseDisabled = value <= min;
  const isIncreaseDisabled = value >= max;

  return (
    <div
      className={cn(
        "box-border flex w-full min-w-0 items-center justify-between gap-x3",
        "min-h-x14 rounded-r2 border border-gray-300 bg-gray-00",
        "px-x4 py-x3 sm:px-x5 sm:py-x4",
      )}
    >
      <span className="min-w-0 shrink-0 font-sans text-size-4 leading-t5 text-gray-700 sm:text-size-5">
        {value}개
      </span>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center justify-end gap-x1",
          "max-w-[min(100%,11.5rem)] sm:max-w-[13rem]",
        )}
        role="group"
        aria-label="추천 빵집 개수 조절"
      >
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isDecreaseDisabled}
          className={controlButtonClassName}
          aria-label="추천 개수 줄이기"
        >
          −
        </button>

        <span
          className="min-w-[2.5ch] flex-1 text-center font-sans text-size-5 leading-t6 font-medium text-gray-1000 sm:text-size-6"
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </span>

        <button
          type="button"
          onClick={handleIncrease}
          disabled={isIncreaseDisabled}
          className={controlButtonClassName}
          aria-label="추천 개수 늘리기"
        >
          +
        </button>
      </div>
    </div>
  );
}
