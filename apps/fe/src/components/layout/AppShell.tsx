import type { ReactNode } from "react";

import { MOBILE_BASE_MIN_HEIGHT, RESPONSIVE_FRAME_WIDTH } from "./layout.constants";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

const AppShell = ({ children, className, contentClassName }: AppShellProps) => {
  return (
    <div
      className={`mx-auto w-full bg-gray-200 ${RESPONSIVE_FRAME_WIDTH} ${MOBILE_BASE_MIN_HEIGHT} md:min-h-screen ${className ?? ""}`}
    >
      <div className={`flex min-h-full flex-col md:min-h-screen ${contentClassName ?? ""}`}>
        {children}
      </div>
    </div>
  );
};

export default AppShell;
