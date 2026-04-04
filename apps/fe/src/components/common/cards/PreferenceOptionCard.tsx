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
        "flex w-full min-h-x16 flex-col items-center justify-center gap-x0-5 overflow-hidden rounded-r2 border px-x5 pb-x3 pt-x2-5 transition",
        selected
          ? "border-gray-600 bg-gray-300"
          : "border-gray-200 bg-gray-100 hover:border-gray-600 hover:bg-gray-300",
      )}
    >
      {icon ? <div className="flex items-center justify-start p-x2">{icon}</div> : null}

      <span className="font-sans text-size-5 leading-t5 font-medium tracking-2 self-stretch text-center text-gray-900">
        {label}
      </span>
    </button>
  );
}
