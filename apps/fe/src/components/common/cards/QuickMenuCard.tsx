// 지역별 / 종류별 / 에디터픽 / 테마별 각각 1장
import type { ReactNode } from "react";

import Skeleton from "@/components/common/skeleton/Skeleton";

type QuickMenuCardProps = {
  label: string;
  imageSrc?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

const QuickMenuCard = ({ label, imageSrc, icon, onClick }: QuickMenuCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[90px] w-[84.5px] flex-col items-center justify-center gap-x1-5 overflow-hidden rounded-[var(--radius-r2)] border border-gray-200 bg-gray-100 px-3 py-3 text-center"
    >
      <div className="mx-auto flex h-[36px] w-[36px] shrink-0 items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            aria-hidden
            className="block h-[36px] w-[36px] object-contain object-center"
          />
        ) : (
          (icon ?? <Skeleton shape="circle" className="h-[36px] w-[36px]" />)
        )}
      </div>

      <span className="typo-t2medium whitespace-nowrap text-gray-1000">{label}</span>
    </button>
  );
};

export default QuickMenuCard;
