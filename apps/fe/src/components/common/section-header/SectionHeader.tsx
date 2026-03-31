// components/common/section-header/SectionHeader.tsx
// 섹션 위에 붙는 제목 + 액션(더보기 등) UI 컴포넌트

type Props = {
  title: string;
  action?: string;
  onClick?: () => void;
};

const SectionHeader = ({ title, action, onClick }: Props) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>

      {action && (
        <button onClick={onClick} className="text-sm text-gray-400">
          {action}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
