// components/common/section-header/SectionHeader.tsx
// 섹션 위에 붙는 제목 + 액션(더보기 등) UI 컴포넌트

// ReactNode 타입은 React에서 사용할 수 있는 모든 요소를 나타내는 타입입니다.
// 문자열, 숫자, JSX 요소, 배열 등 다양한 형태의 자식 요소를 허용합니다.
import type { ReactNode } from "react";
import Button from "../Button/Button";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  icon?: ReactNode;
  onActionClick?: () => void;
};

const SectionHeader = ({ title, actionLabel, icon, onActionClick }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x1">
        {icon && <div className="flex items-center justify-center">{icon}</div>}
        <h2 className="text-size-5 leading-t6 font-bold tracking-2 text-gray-1000">{title}</h2>
      </div>

      {actionLabel && onActionClick && (
        <Button
          type="button"
          onClick={onActionClick}
          className="text-size-3 leading-t4 font-medium tracking-2 text-gray-700 hover:text-gray-900"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default SectionHeader;
