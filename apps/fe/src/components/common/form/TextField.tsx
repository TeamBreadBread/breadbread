import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TextFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  className?: string;
  /** Hide Korean jamo / syllables in the value (e.g. for login IDs). */
  blockKorean?: boolean;
  error?: boolean;
  trailingIcon?: ReactNode;
}

export default function TextField({
  placeholder,
  value,
  onChange,
  disabled = false,
  type = "text",
  className,
  blockKorean = false,
  error = false,
  trailingIcon,
}: TextFieldProps) {
  const handleChange = (nextValue: string) => {
    const sanitized = blockKorean ? nextValue.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "") : nextValue;
    onChange?.(sanitized);
  };

  return (
    <div className="relative flex w-full items-center">
      <input
        type={type}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error}
        className={cn(
          "flex h-x14 w-full items-center rounded-r3 border px-x5 py-x4 font-pretendard typo-t5regular outline-none",
          disabled
            ? "border-gray-200 bg-gray-200"
            : error
              ? "border-[color:var(--color-red-700)] focus:border-[color:var(--color-red-700)] bg-white"
              : "border-gray-400 bg-white",
          value && !error ? "text-gray-1000" : "text-gray-500",
          trailingIcon && "pr-12",
          className,
        )}
      />
      {trailingIcon ? <div className="absolute right-x4 text-gray-700">{trailingIcon}</div> : null}
    </div>
  );
}
