import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { MOBILE_BASE_MIN_HEIGHT, RESPONSIVE_FRAME_WIDTH } from "./layout.constants";

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
}

export default function MobileFrame({ children, className }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-200">
      <div
        className={cn(
          `mx-auto flex w-full flex-col overflow-x-hidden bg-white ${RESPONSIVE_FRAME_WIDTH} ${MOBILE_BASE_MIN_HEIGHT} md:min-h-screen`,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
