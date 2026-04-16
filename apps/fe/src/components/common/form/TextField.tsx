import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  trailingIcon?: ReactNode;
}

export default function TextField({ trailingIcon, className, ...props }: TextFieldProps) {
  return (
    <div className="flex h-14 w-full items-center rounded-r3 border border-gray-300 bg-gray-00 px-x4 py-x3">
      <input
        className={cn(
          "w-full bg-transparent text-size-4 font-normal leading-t5 tracking-1 text-gray-1000 placeholder:text-gray-500 focus:outline-none",
          className,
        )}
        {...props}
      />

      {trailingIcon && <span className="ml-x2 shrink-0 text-gray-700">{trailingIcon}</span>}
    </div>
  );
}
