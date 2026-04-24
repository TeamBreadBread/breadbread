import type { ReactNode } from "react";

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  icon?: ReactNode;
};

const BottomNavItem = ({ label, active = false, icon }: BottomNavItemProps) => {
  return (
    <button
      type="button"
      className="flex flex-1 flex-col items-center justify-center gap-1 sm:gap-[6px]"
    >
      {icon ?? (
        <div
          className={`h-[18px] w-[18px] rounded-full sm:h-[20px] sm:w-[20px] ${
            active ? "bg-gray-1000" : "bg-gray-600"
          }`}
        />
      )}
      <span
        className={`text-[11px] leading-[15px] font-medium sm:text-[12px] sm:leading-[16px] ${
          active ? "text-gray-1000" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export default BottomNavItem;
