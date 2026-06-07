import { useEffect, useRef, type ReactNode } from "react";
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
 *
 * wheel + preventDefault 는 React onWheel(passive)에서 동작하지 않아 native listener 로 등록한다.
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
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollRef}
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
