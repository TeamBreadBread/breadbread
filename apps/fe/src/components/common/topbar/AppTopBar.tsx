import ArrowLeft from "@/assets/icons/ArrowLeft.svg";

interface AppTopBarProps {
  title: string;
  onBack?: () => void;
}

export default function AppTopBar({ title, onBack }: AppTopBarProps) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-300 bg-white px-x5 py-x2_5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center"
          aria-label="뒤로 가기"
        >
          <img src={ArrowLeft} alt="" className="size-6" />
        </button>
      ) : (
        <div className="size-9" />
      )}
      <span className="absolute left-1/2 -translate-x-1/2 font-pretendard typo-t6bold text-[#1a1c20]">
        {title}
      </span>
      <div className="size-9" />
    </header>
  );
}
