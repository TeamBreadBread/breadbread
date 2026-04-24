import { cn } from "@/utils/cn";

interface RadioRowProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export default function RadioRow({ label, checked = false, onCheckedChange }: RadioRowProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange?.(true)}
      className="flex w-full items-center gap-x2 text-left"
      aria-pressed={checked}
    >
      <div
        className={cn(
          "relative flex h-[18px] w-[18px] items-center justify-center rounded-full border",
          checked ? "border-gray-800 bg-gray-800" : "border-gray-400 bg-white",
        )}
      >
        {checked ? <span className="h-[8px] w-[8px] rounded-full bg-white" /> : null}
      </div>
      <span className="font-pretendard typo-t5regular flex-1 text-gray-1000">{label}</span>
    </button>
  );
}
