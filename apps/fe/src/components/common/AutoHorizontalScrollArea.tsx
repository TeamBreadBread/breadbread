import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type AutoHorizontalScrollAreaProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  /** px/s — 기본 28 */
  speed?: number;
  /** true면 scrollWidth/2 지점에서 처음으로 되돌림 (자식 목록 2배 복제 필요) */
  loop?: boolean;
  enabled?: boolean;
};

export default function AutoHorizontalScrollArea({
  children,
  className,
  "aria-label": ariaLabel,
  speed = 28,
  loop = false,
  enabled = true,
}: AutoHorizontalScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const pause = () => {
      pausedRef.current = true;
    };
    const resume = () => {
      pausedRef.current = false;
    };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });
    el.addEventListener("touchcancel", resume, { passive: true });

    return () => {
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("touchcancel", resume);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const el = scrollRef.current;
    if (!el) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 48);
      lastTime = now;

      const canScroll = el.scrollWidth > el.clientWidth + 1;
      if (canScroll && !pausedRef.current && !reducedMotionRef.current) {
        el.scrollLeft += (speed * delta) / 1000;

        if (loop) {
          const loopPoint = el.scrollWidth / 2;
          if (el.scrollLeft >= loopPoint) {
            el.scrollLeft -= loopPoint;
          }
        } else if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          el.scrollLeft = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, loop, speed, children]);

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
