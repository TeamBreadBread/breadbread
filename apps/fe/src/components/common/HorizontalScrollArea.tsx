import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type HorizontalScrollAreaProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * 가로 스크롤 영역.
 * - 모바일: 가로 스와이프로 카드 탐색, 세로 스와이프는 페이지 스크롤로 전달
 * - 데스크톱: 휠 세로 입력은 페이지 스크롤 우선 (Shift+휠 시 가로 스크롤)
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
      if (!event.shiftKey) return;
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
        "scrollbar-hide w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain",
        className,
      )}
    >
      {children}
    </div>
  );
}
