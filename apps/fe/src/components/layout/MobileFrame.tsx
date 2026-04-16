import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type MobileFrameProps = {
  children: ReactNode;
  className?: string;
};

const MobileFrame = ({ children, className }: MobileFrameProps) => {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen w-full max-w-[744px] flex-col bg-gray-00",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default MobileFrame;
