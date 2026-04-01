// components/common/section-header/SectionHeader.tsx
// 섹션 위에 붙는 제목 + 액션(더보기 등) UI 컴포넌트

// ReactNode 타입은 React에서 사용할 수 있는 모든 요소를 나타내는 타입입니다.
// 문자열, 숫자, JSX 요소, 배열 등 다양한 형태의 자식 요소를 허용합니다.
import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  icon?: ReactNode;
  onActionClick?: () => void;
};

const SectionHeader = ({ title, actionLabel, icon, onActionClick }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {icon && <div className="flex items-center justify-center">{icon}</div>}
        <h2 className="text-[18px] leading-[24px] font-bold tracking-[-0.02em] text-gray-1000">
          {title}
        </h2>
      </div>

      {actionLabel && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="text-[14px] leading-[19px] font-medium tracking-[-0.02em] text-gray-700 hover:text-gray-900"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
