import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import { cn } from "@/utils/cn";
import {
  FIXED_TOP_BAR_FRAME_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
  RESPONSIVE_FRAME_WIDTH,
} from "@/components/layout/layout.constants";

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

  const shell = cn(FIXED_TOP_BAR_FRAME_CLASS, RESPONSIVE_FRAME_WIDTH, "bg-white");

  if (!shouldShowBackButton) {
    return (
      <>
        <header className={shell}>
          <div
            className={cn(
              "flex h-14 shrink-0 items-center justify-start border-b border-gray-300 px-x5 py-x2_5",
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
          </div>
        </header>
        <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
      </>
    );
  }

  return (
    <>
      <header className={shell}>
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
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
}
