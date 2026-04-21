import type { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[744px] flex-col bg-white">
      {children}
    </div>
  );
}
