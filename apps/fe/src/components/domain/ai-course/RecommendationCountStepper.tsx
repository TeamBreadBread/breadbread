import { cn } from "@/utils/cn";

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
    <div className="mx-auto flex h-[56px] w-full max-w-[362px] shrink-0 flex-row items-center justify-between overflow-hidden rounded-[12px] border border-solid border-[#dcdee3] px-[20px] py-[16px]">
      <div className="font-sans whitespace-nowrap text-[16px] leading-[22px] text-[#555d6d]">
        {value}개
      </div>
      <div className="flex w-[100px] shrink-0 flex-row items-center justify-start">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isDecreaseDisabled}
          className={cn(
            "flex shrink-0 flex-row items-center justify-start rounded-[4px] bg-[#f7f8f9] p-[4px]",
            isDecreaseDisabled && "cursor-not-allowed opacity-40",
          )}
          aria-label="추천 개수 줄이기"
        >
          <span className="flex h-6 w-6 items-center justify-center font-sans text-[18px] leading-none font-medium text-[#1a1c20]">
            −
          </span>
        </button>
        <div className="flex flex-1 flex-col justify-center self-stretch text-center font-sans text-[18px] leading-[24px] text-[#1a1c20]">
          {value}
        </div>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isIncreaseDisabled}
          className={cn(
            "flex shrink-0 flex-row items-center justify-start rounded-[4px] bg-[#f7f8f9] p-[4px]",
            isIncreaseDisabled && "cursor-not-allowed opacity-40",
          )}
          aria-label="추천 개수 늘리기"
        >
          <span className="flex h-6 w-6 items-center justify-center font-sans text-[18px] leading-none font-medium text-[#1a1c20]">
            +
          </span>
        </button>
      </div>
    </div>
  );
}
