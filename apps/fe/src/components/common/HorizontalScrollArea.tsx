import { useCallback, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type HorizontalScrollAreaProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * 가로 스크롤 영역.
 * - 모바일: 터치 스와이프
 * - 데스크톱: 마우스 휠(세로)을 가로 스크롤로 변환 (스크롤바 숨김 시 필수)
 */
export default function HorizontalScrollArea({
  children,
  className,
  "aria-label": ariaLabel,
}: HorizontalScrollAreaProps) {
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth + 1) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }, []);

  return (
    <div
      onWheel={onWheel}
      aria-label={ariaLabel}
      className={cn(
        "scrollbar-hide w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x",
        className,
      )}
    >
      {children}
    </div>
  );
}
