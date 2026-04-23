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
    <div className="sticky bottom-0 grid grid-cols-2 gap-[9px] border-t border-gray-300 bg-white p-x5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-white"
      />
      <button
        type="button"
        onClick={onLeftClick}
        className="h-14 rounded-r3 bg-[#f3f4f5] font-pretendard typo-t5medium text-[#2a3038]"
      >
        {leftText}
      </button>
      <button
        type="button"
        onClick={onRightClick}
        className="h-14 rounded-r3 bg-[#1a1c20] font-pretendard typo-t5medium text-white"
      >
        {rightText}
      </button>
    </div>
  );
}
