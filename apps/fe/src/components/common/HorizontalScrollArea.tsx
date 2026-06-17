import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type HorizontalScrollAreaProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

const SCROLL_AREA_CLASS =
  "scrollbar-hide w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain [touch-action:pan-x_pan-y] [-webkit-overflow-scrolling:touch]";

/**
 * 가로 스크롤 영역.
 * - 모바일: 가로·세로 스와이프 모두 허용 (세로는 페이지 스크롤로 전달)
 * - 데스크톱: 휠 세로 입력은 페이지 스크롤 우선, Shift+휠·트랙패드 가로 제스처는 가로 스크롤
 */
export default function HorizontalScrollArea({
  children,
  className,
  "aria-label": ariaLabel,
}: HorizontalScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;

      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);

      // 트랙패드 가로 제스처 — overflow-x-auto 가 처리
      if (absX > absY) return;

      // 마우스 휠 세로 입력 + Shift → 가로 스크롤
      if (event.shiftKey && absY > 0) {
        event.preventDefault();
        el.scrollLeft += event.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={scrollRef} aria-label={ariaLabel} className={cn(SCROLL_AREA_CLASS, className)}>
      {children}
    </div>
  );
}
