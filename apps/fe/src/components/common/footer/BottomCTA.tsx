interface BottomCTAProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
  enabledBgClassName?: string;
  disabledBgClassName?: string;
}

export default function BottomCTA({
  text,
  disabled = false,
  onClick,
  enabledBgClassName = "bg-gray-800",
  disabledBgClassName = "bg-gray-300",
}: BottomCTAProps) {
  return (
    <div className="w-full border-t border-gray-200 bg-gray-00 px-x5 py-x4">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`font-pretendard typo-t5medium w-full rounded-r3 py-x4 text-gray-00 ${disabled ? disabledBgClassName : enabledBgClassName}`}
      >
        {text}
      </button>
    </div>
  );
}
