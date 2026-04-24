import { cn } from "@/utils/cn";

interface CheckboxRowProps {
  label: string;
  checked?: boolean;
  required?: boolean;
  hasArrow?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  labelClassName?: string;
}

export default function CheckboxRow({
  label,
  checked = false,
  hasArrow = false,
  onCheckedChange,
  labelClassName,
}: CheckboxRowProps) {
  return (
    <div className="flex items-center gap-x2">
      <button
        type="button"
        onClick={() => onCheckedChange?.(!checked)}
        className="flex flex-1 items-center gap-x2 text-left"
        aria-pressed={checked}
      >
        <span
          className={cn(
            "rounded-r1 flex h-[18px] w-[18px] items-center justify-center border",
            checked ? "border-gray-800 bg-gray-800" : "border-gray-400 bg-white",
          )}
        >
          {checked ? <span className="text-[11px] leading-none text-white">✓</span> : null}
        </span>
        <span className={cn("font-pretendard typo-t5regular flex-1 text-gray-700", labelClassName)}>
          {label}
        </span>
      </button>
      {hasArrow ? (
        <button type="button" aria-label="상세 보기" className="h-[22px] w-[22px] text-gray-500">
          ›
        </button>
      ) : null}
    </div>
  );
}
