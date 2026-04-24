import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface FieldLabelProps {
  children: ReactNode;
  className?: string;
}

export default function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <label className={cn("font-pretendard typo-t4medium text-gray-800", className)}>
      {children}
    </label>
  );
}
