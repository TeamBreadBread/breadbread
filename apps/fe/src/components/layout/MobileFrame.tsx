import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
}

export default function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full bg-gray-200">
      <div
        className={cn(
          "mx-auto flex min-h-screen w-full max-w-[744px] flex-col bg-white",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
