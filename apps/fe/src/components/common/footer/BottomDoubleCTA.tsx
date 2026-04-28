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
    <div className="sticky bottom-0 bg-gray-00">
      <div className="flex justify-center gap-[10px] border-t border-gray-300 bg-gray-00 px-[20px] py-x3">
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
          onClick={onRightClick}
          className="flex h-x14 max-w-[300px] flex-1 items-center justify-center rounded-r3 bg-gray-800 px-x5 py-x4"
        >
          <span className="whitespace-nowrap text-center text-size-5 font-bold leading-t6 tracking-0 text-gray-00">
            {rightText}
          </span>
        </button>
      </div>
    </div>
  );
}
