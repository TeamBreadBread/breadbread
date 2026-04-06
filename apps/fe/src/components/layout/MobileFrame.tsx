import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
}

export default function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-gray-100 px-x3 py-x4">
      <div
        className={cn(
          "mx-auto min-h-[calc(100vh-32px)] w-full max-w-[744px] overflow-hidden rounded-r4 bg-gray-00 shadow-2",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
