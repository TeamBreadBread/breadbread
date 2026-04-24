import { cn } from "@/utils/cn";
import Button from "@/components/common/Button/Button";

interface RecommendationCountStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

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
    <div className="flex w-full items-center justify-between gap-x3 rounded-r3 bg-gray-100 px-x4 py-x4">
      <Button
        type="button"
        variant="secondary"
        onClick={handleDecrease}
        disabled={isDecreaseDisabled}
        className={cn("h-x10 w-x10 rounded-full px-0 py-0", isDecreaseDisabled && "opacity-40")}
        aria-label="추천 개수 줄이기"
      >
        -
      </Button>

      <div className="flex min-w-x16 flex-col items-center justify-center">
        <span className="font-sans text-size-8 leading-t8 font-bold tracking-2 text-gray-1000">
          {value}
        </span>
        <span className="font-sans text-size-2 leading-t3 font-medium tracking-1 text-gray-700">
          개
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={handleIncrease}
        disabled={isIncreaseDisabled}
        className={cn("h-x10 w-x10 rounded-full px-0 py-0", isIncreaseDisabled && "opacity-40")}
        aria-label="추천 개수 늘리기"
      >
        +
      </Button>
    </div>
  );
}
