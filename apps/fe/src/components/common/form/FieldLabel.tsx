import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface FieldLabelProps {
  children: ReactNode;
  className?: string;
}

export default function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <label
      className={cn(
        "text-size-4 font-medium leading-t5 tracking-[-0.1px] text-gray-1000",
        className,
      )}
    >
      {children}
    </label>
  );
}
