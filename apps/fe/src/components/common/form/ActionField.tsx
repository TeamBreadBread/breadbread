import { useState } from "react";
import { cn } from "@/utils/cn";

interface ActionFieldProps {
  placeholder?: string;
  actionText: string;
  disabled?: boolean;
  variant?: "fill" | "outline";
  actionButtonClassName?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
  inputBgColor?: "white" | "gray-00" | "gray-200" | "gray-400";
  value?: string;
  onValueChange?: (value: string) => void;
  onActionClick?: () => void;
  disableHover?: boolean;
  isVerified?: boolean;
  tone?: "default" | "error" | "success";
}

export default function ActionField({
  placeholder,
  actionText,
  disabled = false,
  variant = "fill",
  actionButtonClassName,
  inputMode,
  inputBgColor = "white",
  value,
  onValueChange,
  onActionClick,
  disableHover = false,
  isVerified = false,
  tone = "default",
}: ActionFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const currentValue = value ?? inputValue;
  const bgColorClass =
    inputBgColor === "gray-00"
      ? "bg-gray-00"
      : inputBgColor === "gray-200"
        ? "bg-gray-200"
        : inputBgColor === "gray-400"
          ? "bg-gray-400"
          : "bg-white";
  const borderColorClass =
    tone === "error"
      ? "border-red-700"
      : tone === "success"
        ? "border-green-700"
        : "border-gray-300";

  return (
    <div
      className={cn(
        "flex h-14 w-full items-center gap-x2 rounded-r3 border p-x2",
        bgColorClass,
        borderColorClass,
      )}
    >
      <input
        value={currentValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onValueChange?.(e.target.value);
        }}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className={cn(
          "h-full w-full bg-transparent px-x2 text-size-4 font-normal leading-t5 tracking-[-0.1px] placeholder:text-gray-500 focus:outline-none",
          isVerified ? "text-gray-500" : "text-gray-1000 disabled:text-gray-500",
        )}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={onActionClick}
        className={cn(
          "h-10 shrink-0 rounded-r2 px-x3 text-size-3 font-medium leading-t4 tracking-[-0.1px]",
          variant === "outline"
            ? disabled
              ? "bg-white text-gray-500"
              : isVerified
                ? "bg-transparent text-gray-500"
                : cn(
                    "bg-white text-gray-500",
                    !disableHover && "hover:bg-gray-50 active:bg-gray-100",
                  )
            : disabled
              ? "bg-gray-300 text-gray-500"
              : "bg-gray-1000 text-white hover:bg-gray-900 active:bg-gray-800",
          actionButtonClassName,
        )}
      >
        {actionText}
      </button>
    </div>
  );
}
