import type { HTMLAttributes, ReactNode } from "react";

interface HelperTextProps {
  children: ReactNode;
  className?: HTMLAttributes<HTMLParagraphElement>["className"];
}

export default function HelperText({ children, className }: HelperTextProps) {
  return (
    <p className={`font-pretendard typo-t3regular text-gray-700 ${className ?? ""}`}>{children}</p>
  );
}
