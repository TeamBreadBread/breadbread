interface ActionFieldProps {
  placeholder?: string;
  value?: string;
  actionText: string;
  disabled?: boolean;
  readOnly?: boolean;
  inputBgClassName?: string;
  onChange?: (value: string) => void;
  onAction?: () => void;
}

export default function ActionField({
  placeholder,
  value,
  actionText,
  disabled = false,
  readOnly = false,
  inputBgClassName = "bg-gray-00",
  onChange,
  onAction,
}: ActionFieldProps) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        className={`font-pretendard typo-t5regular w-full rounded-r3 border border-gray-300 px-x4 py-x3 pr-x20 text-gray-1000 placeholder-gray-600 outline-none focus:border-gray-300 focus:ring-0 ${inputBgClassName} ${disabled ? "disabled:bg-gray-100" : ""}`}
      />
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="absolute right-x4 top-1/2 -translate-y-1/2 cursor-default select-none font-pretendard typo-t5regular whitespace-nowrap bg-transparent px-0 py-0 text-gray-700 disabled:text-gray-500"
      >
        {actionText}
      </button>
    </div>
  );
}
