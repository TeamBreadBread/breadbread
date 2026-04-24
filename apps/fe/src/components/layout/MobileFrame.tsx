import type { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-gray-200">
      <div className="mx-auto flex min-h-screen w-full max-w-x186 flex-col bg-gray-200">
        {children}
      </div>
    </div>
  );
}
