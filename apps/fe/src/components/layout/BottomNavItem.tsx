import type { ReactNode } from "react";

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  /** 탭 위에 띄우는 안내 툴팁 (예: 코스 안내 중) */
  tooltip?: string;
};

const BottomNavItem = ({ label, active = false, icon, onClick, tooltip }: BottomNavItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 sm:gap-[6px]"
    >
      {tooltip ? (
        <span className="pointer-events-none absolute -top-[26px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-[10px] py-[4px] text-[11px] font-medium leading-[14px] text-white shadow-sm">
          {tooltip}
        </span>
      ) : null}
      {icon ?? (
        <div
          className={`h-[24px] w-[24px] rounded-full ${active ? "bg-gray-900" : "bg-gray-500"}`}
        />
      )}
      <span
        className={`text-[11px] leading-[15px] font-normal sm:text-[12px] sm:leading-[16px] ${
          active ? "text-gray-900" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export default BottomNavItem;
