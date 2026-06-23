import { cn } from "@/utils/cn";

type TagChipSelectorProps<T extends string> = {
  label: string;
  hint?: string;
  options: readonly T[];
  selected: readonly T[];
  maxCount: number;
  onChange: (next: T[]) => void;
  formatLabel: (tag: T) => string;
  disabled?: boolean;
  className?: string;
};

export default function TagChipSelector<T extends string>({
  label,
  hint,
  options,
  selected,
  maxCount,
  onChange,
  formatLabel,
  disabled = false,
  className,
}: TagChipSelectorProps<T>) {
  const handleToggle = (tag: T) => {
    if (disabled) return;
    if (selected.includes(tag)) {
      onChange(selected.filter((item) => item !== tag));
      return;
    }
    if (selected.length >= maxCount) return;
    onChange([...selected, tag]);
  };

  return (
    <div className={cn("flex flex-col gap-[8px]", className)}>
      <div className="flex flex-col gap-[2px]">
        <span className="text-[14px] leading-[19px] font-semibold text-[#1a1c20]">{label}</span>
        {hint ? <span className="text-[12px] leading-[17px] text-[#868b94]">{hint}</span> : null}
      </div>
      <div className="flex flex-wrap gap-[8px]">
        {options.map((tag) => {
          const isSelected = selected.includes(tag);
          const isDisabledOption = disabled || (!isSelected && selected.length >= maxCount);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabledOption}
              onClick={() => handleToggle(tag)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-[12px] py-[7px] text-[13px] leading-[18px] font-medium transition-colors",
                isSelected
                  ? "border-[#E8623A] bg-[#FFF0EB] text-[#1a1c20]"
                  : "border-[#dcdee3] bg-white text-[#4d5159]",
                isDisabledOption && !isSelected && "cursor-not-allowed opacity-40",
              )}
            >
              {formatLabel(tag)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
