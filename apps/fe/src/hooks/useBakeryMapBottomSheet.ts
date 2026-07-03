import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const FULL_TOP_RATIO = 0.14;
const MID_TOP_RATIO = 0.5;
const PEEK_TOP_RATIO = 0.72;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSnapAnchors(viewportHeight: number) {
  const fullTop = Math.round(viewportHeight * FULL_TOP_RATIO);
  const midTop = Math.round(viewportHeight * MID_TOP_RATIO);
  const peekTop = Math.round(viewportHeight * PEEK_TOP_RATIO);
  return { fullTop, midTop, peekTop };
}

function snapToNearestAnchor(topY: number, viewportHeight: number) {
  const { fullTop, midTop, peekTop } = getSnapAnchors(viewportHeight);
  const stops = [fullTop, midTop, peekTop];
  return stops.reduce((best, stop) =>
    Math.abs(topY - stop) < Math.abs(topY - best) ? stop : best,
  );
}

export function useBakeryMapBottomSheet() {
  const sheetRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  const [sheetTopY, setSheetTopY] = useState(() =>
    Math.round((typeof window !== "undefined" ? window.innerHeight : 800) * PEEK_TOP_RATIO),
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startTop: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const h = window.innerHeight;
      setViewportHeight(h);
      setSheetTopY((prev) => snapToNearestAnchor(prev, h));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { fullTop, midTop, peekTop } = getSnapAnchors(viewportHeight);
  const isFullSheet = sheetTopY <= fullTop + 8;
  const isMidSheet = !isFullSheet && sheetTopY <= midTop + 8;

  const togglePhase = useCallback(() => {
    setSheetTopY((prev) => {
      if (prev <= fullTop + 8) return peekTop;
      if (prev <= midTop + 8) return fullTop;
      return midTop;
    });
  }, [fullTop, midTop, peekTop]);

  const onHandlePointerDown = useCallback(
    (clientY: number) => {
      dragRef.current = { startY: clientY, startTop: sheetTopY };
      setIsDragging(true);
    },
    [sheetTopY],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = clamp(drag.startTop + (clientY - drag.startY), fullTop, peekTop);
      setSheetTopY(next);
    };

    const onEnd = () => {
      setIsDragging(false);
      dragRef.current = null;
      setSheetTopY((prev) => snapToNearestAnchor(prev, viewportHeight));
    };

    const handleMouseMove = (event: MouseEvent) => onMove(event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches[0]) onMove(event.touches[0].clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [fullTop, isDragging, peekTop, viewportHeight]);

  return {
    sheetRef,
    contentRef,
    sheetTopY,
    mapHeightPx: Math.max(160, Math.round(sheetTopY)),
    isDragging,
    isFullSheet,
    isMidSheet,
    togglePhase,
    onHandlePointerDown,
  };
}
