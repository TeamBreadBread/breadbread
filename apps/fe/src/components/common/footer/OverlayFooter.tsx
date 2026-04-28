import { Button } from "@/components/common/Button";
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
    <div
      className={cn("fixed bottom-0 left-1/2 z-20 w-full max-w-x186 -translate-x-1/2 bg-gray-00")}
    >
      <div className="h-x12 bg-gradient-to-b from-transparent to-gray-00" />

      <div
        className={cn(
          "flex items-start justify-center gap-[10px] overflow-hidden",
          "mt-x3 border-t border-gray-300 bg-gray-00 px-[20px] py-x3",
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
