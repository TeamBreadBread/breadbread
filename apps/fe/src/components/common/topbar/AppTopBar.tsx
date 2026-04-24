import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";

interface AppTopBarProps {
  title: string;
  onBack?: () => void;
}

export default function AppTopBar({ title, onBack }: AppTopBarProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate({ to: "/" }));

  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="relative flex h-14 items-center justify-between border-b border-gray-300 px-x5">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center"
        >
          <img src={ArrowLeft} alt="" className="size-6" />
        </button>

        <h1 className="font-pretendard typo-t6bold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-1000">
          {title}
        </h1>

        <div className="h-9 w-9" />
      </div>
    </header>
  );
}
