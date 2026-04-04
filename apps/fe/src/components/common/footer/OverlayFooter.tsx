import Button from "@/components/common/Button/Button";
import { cn } from "@/utils/cn";

interface OverlayFooterProps {
  leftText?: string;
  rightText?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

export default function OverlayFooter({
  leftText = "취소",
  rightText = "다음",
  onLeftClick,
  onRightClick,
}: OverlayFooterProps) {
  return (
    <div className={cn("sticky bottom-0 bg-gray-00")}>
      <div className="h-x12 bg-gradient-to-b from-transparent to-gray-00" />

      <div
        className={cn(
          "flex items-start justify-center gap-x2-5 overflow-hidden",
          "border-t border-gray-300 bg-gray-00 px-x5 py-x3",
        )}
      >
        <Button variant="secondary" fullWidth className="max-w-x80" onClick={onLeftClick}>
          {leftText}
        </Button>

        <Button variant="primary" fullWidth className="max-w-x80" onClick={onRightClick}>
          {rightText}
        </Button>
      </div>
    </div>
  );
}
