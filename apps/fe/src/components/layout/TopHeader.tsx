import { cn } from "@/utils/cn";

type TopHeaderProps = {
  className?: string;
};

const TopHeader = ({ className }: TopHeaderProps) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-x14 items-center justify-between bg-gray-00 px-x4",
        className,
      )}
    >
      <span className="text-size-6 font-bold tracking-2 text-gray-1000">BreadBread</span>
    </header>
  );
};

export default TopHeader;
