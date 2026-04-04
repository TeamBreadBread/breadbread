import { cn } from "@/utils/cn";
import MobileFrame from "./MobileFrame";
import TopHeader from "./TopHeader";
import BottomNav from "./BottomNav";

type AppShellProps = {
  children: React.ReactNode;
  activePath?: string;
  className?: string;
};

const AppShell = ({ children, activePath, className }: AppShellProps) => {
  return (
    <MobileFrame>
      <TopHeader />
      <main className={cn("flex-1 overflow-y-auto", className)}>{children}</main>
      <BottomNav activePath={activePath} />
    </MobileFrame>
  );
};

export default AppShell;
