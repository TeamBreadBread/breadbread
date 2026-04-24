import type { ReactNode } from "react";

import { APP_SHELL_MAX_WIDTH } from "./layout.constants";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

const AppShell = ({ children, className, contentClassName }: AppShellProps) => {
  return (
    <div
      className={`mx-auto min-h-screen w-full bg-gray-200 ${APP_SHELL_MAX_WIDTH} ${className ?? ""}`}
    >
      <div className={`flex min-h-screen flex-col ${contentClassName ?? ""}`}>{children}</div>
    </div>
  );
};

export default AppShell;
