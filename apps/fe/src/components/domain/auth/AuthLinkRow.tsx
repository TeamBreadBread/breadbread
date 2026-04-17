interface AuthLinkRowProps {
  leftText: string;
  rightText: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

export default function AuthLinkRow({
  leftText,
  rightText,
  onLeftClick,
  onRightClick,
}: AuthLinkRowProps) {
  return (
    <div className="flex items-center justify-center gap-x3">
      <button
        type="button"
        onClick={onLeftClick}
        className="font-pretendard typo-t4medium whitespace-nowrap text-gray-700"
      >
        {leftText}
      </button>

      <span className="font-pretendard typo-t4regular whitespace-nowrap text-gray-500">|</span>

      <button
        type="button"
        onClick={onRightClick}
        className="font-pretendard typo-t4medium whitespace-nowrap text-gray-700"
      >
        {rightText}
      </button>
    </div>
  );
}
