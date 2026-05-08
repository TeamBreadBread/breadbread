import ArrowLeftIcon from "@/assets/icons/ArrowLeft.svg";
import { cn } from "@/utils/cn";
import {
  FIXED_TOP_BAR_FRAME_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
  RESPONSIVE_FRAME_WIDTH,
} from "@/components/layout/layout.constants";

interface PreferenceTopBarProps {
  title: string;
  /** Defaults to browser back */
  onBack?: () => void;
  /** Renders 취소 on the right (e.g. navigate home) */
  onCancel?: () => void;
}

export default function PreferenceTopBar({ title, onBack, onCancel }: PreferenceTopBarProps) {
  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  return (
    <>
      <header className={cn(FIXED_TOP_BAR_FRAME_CLASS, RESPONSIVE_FRAME_WIDTH, "bg-gray-00")}>
        <div className="relative flex h-x14 items-center justify-between overflow-hidden border-b border-gray-300 bg-gray-00 px-x5 py-x2-5">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={handleBack}
            className="relative z-[1] flex h-x9 w-x9 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <img src={ArrowLeftIcon} alt="" aria-hidden="true" className="h-x4 w-x4" />
          </button>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="relative z-[1] shrink-0 px-x1 py-x1 font-sans text-size-6 leading-t6 font-medium tracking-2 text-gray-900"
            >
              취소
            </button>
          ) : (
            <div className="h-9 w-9 shrink-0" />
          )}

          <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-default select-none whitespace-nowrap text-center font-sans text-size-6 font-bold leading-t6 tracking-2 text-gray-1000">
            {title}
          </h1>
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
}
