import { cn } from "@/utils/cn";

type MobileFrameProps = {
  children: React.ReactNode;
  className?: string;
};

const MobileFrame = ({ children, className }: MobileFrameProps) => {
  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-gray-00",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default MobileFrame;
