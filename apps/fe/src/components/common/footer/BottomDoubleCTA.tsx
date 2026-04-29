import { cn } from "@/utils/cn";

interface BottomDoubleCTAProps {
  leftText: string;
  rightText: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  /** true면 우측(완료/다음) 비활성 */
  rightDisabled?: boolean;
  /** 선호도 페이지 등: 고정 바 (기본은 sticky 단순 레이아웃) */
  placement?: "fixed" | "sticky";
}

export default function BottomDoubleCTA({
  leftText,
  rightText,
  onLeftClick,
  onRightClick,
  rightDisabled = false,
  placement = "sticky",
}: BottomDoubleCTAProps) {
  const inner = (
    <>
      {placement === "fixed" ? (
        <div className="h-x12 bg-gradient-to-b from-transparent to-gray-00" />
      ) : null}

      <div className="flex justify-center gap-[10px] border-t border-gray-300 bg-gray-00 px-[20px] pb-[max(12px,env(safe-area-inset-bottom))] pt-x3">
        <button
          type="button"
          onClick={onLeftClick}
          className="flex h-x14 max-w-[300px] flex-1 items-center justify-center rounded-r3 bg-gray-300 px-x5 py-x4"
        >
          <span className="whitespace-nowrap text-center text-size-5 font-bold leading-t6 tracking-0 text-gray-1000">
            {leftText}
          </span>
        </button>

        <button
          type="button"
          disabled={rightDisabled}
          onClick={onRightClick}
          className={cn(
            "flex h-x14 max-w-[300px] flex-1 items-center justify-center rounded-r3 px-x5 py-x4 font-bold tracking-0",
            rightDisabled
              ? "cursor-not-allowed bg-gray-500 text-gray-300"
              : "bg-gray-800 text-gray-00",
          )}
        >
          <span className="whitespace-nowrap text-center text-size-5 leading-t6">{rightText}</span>
        </button>
      </div>
    </>
  );

  if (placement === "fixed") {
    return (
      <div
        className={cn("fixed bottom-0 left-1/2 z-20 w-full max-w-x186 -translate-x-1/2 bg-gray-00")}
      >
        {inner}
      </div>
    );
  }

  return <div className="sticky bottom-0 bg-gray-00">{inner}</div>;
}
