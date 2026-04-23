import { cn } from "@/utils/cn";

interface PreferenceOptionCardProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function PreferenceOptionCard({
  label,
  selected = false,
  onClick,
}: PreferenceOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[64px] w-full rounded-r2 border px-x5 pt-[10px] pb-x3",
        selected ? "border-[#b0b3ba] bg-[#eeeff1]" : "border-[#f3f4f5] bg-[#f7f8f9]",
      )}
    >
      <span className="block text-center font-pretendard typo-t5medium text-[#2a3038]">
        {label}
      </span>
    </button>
  );
}
