import { Button } from "@/components/common/Button";
import { FIXED_BOTTOM_BAR_FRAME_CLASS } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";

interface OverlayFooterProps {
  leftText?: string;
  rightText?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  /** true면 우측(다음) 버튼 비활성 */
  nextDisabled?: boolean;
}

export default function OverlayFooter({
  leftText = "취소",
  rightText = "다음",
  onLeftClick,
  onRightClick,
  nextDisabled = false,
}: OverlayFooterProps) {
  return (
    <div className={cn(FIXED_BOTTOM_BAR_FRAME_CLASS, "bg-gray-00")}>
      <div
        className={cn(
          "flex items-start justify-center gap-[10px] overflow-hidden",
          "border-t border-gray-300 bg-gray-00 px-[20px] pb-[max(12px,env(safe-area-inset-bottom))] pt-x3",
        )}
      >
        <Button variant="secondary" fullWidth className="max-w-x80" onClick={onLeftClick}>
          {leftText}
        </Button>

        <Button
          variant="primary"
          fullWidth
          disabled={nextDisabled}
          className="max-w-x80 disabled:pointer-events-none disabled:opacity-40"
          onClick={onRightClick}
        >
          {rightText}
        </Button>
      </div>
    </div>
  );
}
