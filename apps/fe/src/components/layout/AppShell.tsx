import { cn } from "@/utils/cn";
import MobileFrame from "./MobileFrame";
import TopHeader from "./TopHeader";
import BottomNav from "./BottomNav";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

const AppShell = ({ children, className }: AppShellProps) => {
  return (
    <MobileFrame>
      <TopHeader />
      <main className={cn("flex-1 overflow-y-auto", className)}>{children}</main>
      <BottomNav />
    </MobileFrame>
  );
};

export default AppShell;
