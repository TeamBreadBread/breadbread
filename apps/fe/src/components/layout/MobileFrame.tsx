import type { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return <div className="mx-auto w-full max-w-[744px] bg-white">{children}</div>;
}
