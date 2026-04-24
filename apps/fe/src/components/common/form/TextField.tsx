import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface TextFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  className?: string;
}

export default function TextField({
  placeholder,
  value,
  onChange,
  disabled = false,
  type = "text",
  className,
}: TextFieldProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "flex h-x14 w-full items-center rounded-r3 border px-x5 py-x4 font-pretendard typo-t5regular outline-none",
        disabled ? "border-gray-200 bg-gray-200" : "border-gray-400 bg-white",
        value ? "text-gray-1000" : "text-gray-500",
        className,
      )}
    />
  );
}
