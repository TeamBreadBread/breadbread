import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  rightText?: string;
  leftIcon?: ReactNode;
}

export default function SectionHeader({
  title,
  rightText = "중복 가능",
  leftIcon,
}: SectionHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-1 items-center gap-x1">
        <div className="flex items-center justify-start p-x0-5">
          {leftIcon ?? <div className="h-x4-5 w-x4-5 rounded-full bg-gray-400" />}
        </div>

        <h3 className="font-sans text-size-6 leading-t6 font-medium tracking-2 flex-1 text-gray-1000">
          {title}
        </h3>
      </div>

      <span className="font-sans text-size-3 leading-t4 font-medium tracking-1 whitespace-nowrap text-right text-gray-700 cursor-default select-none">
        {rightText}
      </span>
    </div>
  );
}
