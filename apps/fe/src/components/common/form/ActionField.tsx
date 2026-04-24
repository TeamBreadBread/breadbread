import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface ActionFieldProps {
  placeholder: string;
  actionText: string;
  value?: string;
  onChange?: (value: string) => void;
  onActionClick?: () => void;
  disabled?: boolean;
  actionDisabled?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  actionClassName?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
}

export default function ActionField({
  placeholder,
  actionText,
  value,
  onChange,
  onActionClick,
  disabled = false,
  actionDisabled = false,
  containerClassName,
  inputClassName,
  actionClassName,
  type = "text",
}: ActionFieldProps) {
  return (
    <div
      className={cn(
        "flex h-x14 items-center gap-x2 overflow-hidden rounded-r3 border px-x5 py-x4",
        disabled ? "border-gray-200 bg-gray-200" : "border-gray-400 bg-white",
        containerClassName,
      )}
    >
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "font-pretendard typo-t5regular flex-1 bg-transparent outline-none",
          value ? "text-gray-1000" : "text-gray-500",
          inputClassName,
        )}
      />

      <button
        type="button"
        onClick={onActionClick}
        disabled={actionDisabled}
        className={cn(
          "font-pretendard typo-t4bold whitespace-nowrap text-gray-500",
          actionClassName,
        )}
      >
        {actionText}
      </button>
    </div>
  );
}
