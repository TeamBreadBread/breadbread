import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import { cn } from "@/utils/cn";

interface AppTopBarProps {
  title: string;
  onBack?: () => void;
  /** Tab-style root: no back control; title is left-aligned */
  hideBack?: boolean;
  /** Keep backward compatibility with existing feature branch usage */
  centered?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function AppTopBar({
  title,
  onBack,
  hideBack,
  centered = false,
  showBackButton = false,
  onBackClick,
}: AppTopBarProps) {
  const navigate = useNavigate();
  const handleBack = onBackClick ?? onBack ?? (() => navigate({ to: "/" }));
  const shouldHideBack = hideBack ?? false;
  const shouldShowBackButton = !shouldHideBack || showBackButton;

  if (!shouldShowBackButton) {
    return (
      <header
        className={cn(
          "sticky top-0 z-20 flex h-14 shrink-0 items-center justify-start",
          "border-b border-gray-300 bg-white px-x5 py-x2_5",
        )}
      >
        <span
          className={cn(
            "w-full text-left font-pretendard typo-t6bold text-size-6 font-bold leading-t6",
            "tracking-[-0.1px] text-gray-1000",
          )}
        >
          {title}
        </span>
      </header>
    );
  }

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

        <h1
          className={cn(
            "font-pretendard typo-t6bold absolute top-1/2 -translate-y-1/2",
            centered ? "left-1/2 -translate-x-1/2" : "left-1/2 -translate-x-1/2",
            "text-gray-1000",
          )}
        >
          {title}
        </h1>

        <div className="h-9 w-9" />
      </div>
    </header>
  );
}
