import ArrowLeft from "@/assets/icons/ArrowLeft.svg";

interface AppTopBarProps {
  title: string;
  onBack?: () => void;
}

export default function AppTopBar({ title, onBack }: AppTopBarProps) {
  return (
    <header className="w-full border-b border-gray-200 bg-gray-00 px-x5 py-x4 flex items-center gap-x5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center flex-shrink-0"
          aria-label="뒤로 가기"
        >
          <img src={ArrowLeft} alt="" className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-6 h-6 flex-shrink-0" />
      )}
      <h2 className="font-pretendard typo-t6medium text-gray-1000">{title}</h2>
    </header>
  );
}
