import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface HelperTextProps {
  children: ReactNode;
  variant?: "default" | "error";
}

export default function HelperText({ children, variant = "default" }: HelperTextProps) {
  return (
    <p
      className={cn(
        "text-size-2 font-normal leading-t3 tracking-[-0.1px]",
        variant === "error" ? "text-red-500" : "text-gray-600",
      )}
    >
      {children}
    </p>
  );
}
