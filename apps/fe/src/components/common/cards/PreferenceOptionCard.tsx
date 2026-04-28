import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PreferenceOptionCardProps {
  label: string;
  selected?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

export default function PreferenceOptionCard({
  label,
  selected = false,
  icon,
  onClick,
}: PreferenceOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "touch-manipulation flex w-full flex-col items-center justify-center gap-x0-5 overflow-hidden rounded-r2 border px-x5 pb-x3 pt-x2-5 transition",
        icon ? "min-h-x16" : "min-h-x16",
        selected ? "border-gray-600 bg-gray-300" : "border-gray-200 bg-gray-100",
      )}
    >
      {icon ? <div className="flex items-center justify-start p-x2">{icon}</div> : null}

      <span className="font-sans text-size-5 leading-t5 font-medium tracking-2 self-stretch text-center text-gray-900">
        {label}
      </span>
    </button>
  );
}
