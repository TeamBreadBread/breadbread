import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
}

export default function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className={cn("mx-auto min-h-screen w-full max-w-[744px]", className)}>{children}</div>
    </div>
  );
}
