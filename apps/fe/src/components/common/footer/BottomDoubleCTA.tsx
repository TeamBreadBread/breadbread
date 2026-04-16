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
  return (
    <div className="sticky bottom-0 bg-white">
      <div className="flex gap-[10px] border-t border-[#eeeff1] bg-white px-[20px] py-[12px]">
        <button
          type="button"
          onClick={onLeftClick}
          className="flex h-[56px] max-w-[300px] flex-1 items-center justify-center rounded-[12px] bg-[#eeeff1] px-[20px] py-[16px]"
        >
          <span className="whitespace-nowrap text-center text-[18px] font-bold leading-[24px] tracking-[0] text-[#1a1c20]">
            {leftText}
          </span>
        </button>

        <button
          type="button"
          onClick={onRightClick}
          className="flex h-[56px] max-w-[300px] flex-1 items-center justify-center rounded-[12px] bg-[#555d6d] px-[20px] py-[16px]"
        >
          <span className="whitespace-nowrap text-center text-[18px] font-bold leading-[24px] tracking-[0] text-white">
            {rightText}
          </span>
        </button>
      </div>

      <div className="relative h-[33px] bg-white">
        <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-[100px] bg-black" />
      </div>
    </div>
  );
}
