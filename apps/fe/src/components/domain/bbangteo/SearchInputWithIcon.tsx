import type { ReactNode } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

type SearchInputWithIconProps = {
  children: ReactNode;
  className?: string;
};

export default function SearchInputWithIcon({ children, className }: SearchInputWithIconProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2">
        <AppIcon src={IconAssets.IcSearch} size="x6" alt="" className="opacity-50" />
      </span>
    </div>
  );
}

export const searchInputPaddingClass = "pr-[44px]";
