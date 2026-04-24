// 지역별 / 종류별 / 에디터픽 / 테마별 각각 1장
import type { ReactNode } from "react";

import Skeleton from "@/components/common/skeleton/Skeleton";

type QuickMenuCardProps = {
  label: string;
  icon?: ReactNode;
};

const QuickMenuCard = ({ label, icon }: QuickMenuCardProps) => {
  return (
    <button
      type="button"
      className="flex h-[89px] w-full flex-col items-center justify-center gap-[2px] overflow-hidden rounded-[var(--radius-r2)] border border-gray-200 bg-gray-100 px-5 py-3"
    >
      <div className="flex items-center justify-center p-[6px]">
        {icon ?? <Skeleton shape="circle" className="h-[36px] w-[36px]" />}
      </div>

      <span className="text-center text-[12px] leading-[16px] font-medium text-gray-900">
        {label}
      </span>
    </button>
  );
};

export default QuickMenuCard;
