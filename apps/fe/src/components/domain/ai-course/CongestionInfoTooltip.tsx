import { useEffect, useId, useRef, useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

const TOOLTIP_TEXT = "혼잡도는 30분마다 갱신되며 SNS 언급량 기준으로 제공됩니다.";

type CongestionInfoTooltipProps = {
  className?: string;
};

export default function CongestionInfoTooltip({ className }: CongestionInfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        aria-label="혼잡도 안내"
        aria-expanded={open}
        aria-controls={tooltipId}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center"
      >
        <AppIcon src={IconAssets.IcInfoCircle} size={14} color="gray-600" />
      </button>

      {open ? (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-[calc(100%+6px)] z-20 -translate-x-1/2"
        >
          <span
            aria-hidden
            className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[6px] border-x-transparent border-b-[#41454E]"
          />
          <div className="flex h-[64px] w-[198px] items-center justify-center rounded-r2 bg-[#41454E] px-x3 py-x2 text-center font-pretendard text-[11px] font-medium leading-[16px] text-white">
            {TOOLTIP_TEXT}
          </div>
        </div>
      ) : null}
    </span>
  );
}
