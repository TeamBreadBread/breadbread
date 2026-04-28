import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** 시트가 많이 확장된 상태 — 기존 `top-[304px]` */
export const AI_BOTTOM_SHEET_MIN_TOP = 304;

/** 절반 높이(맵/시트 균형) */
export function getAiBottomSheetMidTopY(viewportHeight: number): number {
  return viewportHeight * 0.5;
}

/**
 * 50%보다 더 내림 · 핸들 + 타임라인 **2번째 아이템까지** 보일 정도
 * (top이 `midY`보다 큼 → 시트가 더 얇아짐)
 */
export function getAiBottomSheetPeekTopY(viewportHeight: number): number {
  const h = viewportHeight;
  const mid = getAiBottomSheetMidTopY(h);
  /** 바닥에서 시트 높이 — 대략 2개 카드 + 핸들 */
  const sheetHeight = Math.round(Math.min(Math.max(h * 0.4, 280), Math.min(h * 0.5, 400)));
  let top = h - sheetHeight;
  top = Math.max(top, mid + 28);
  top = Math.min(top, h - 76);
  if (top <= mid) top = Math.min(mid + 32, h - 76);
  return Math.round(top);
}

/**
 * 더 내려서 맵이 최대에 가깝게 · 타임라인 **1번 아이템만** 보일 정도
 */
export function getAiBottomSheetPeekOneTopY(viewportHeight: number): number {
  const h = viewportHeight;
  const mid = getAiBottomSheetMidTopY(h);
  const peekTwoTop = getAiBottomSheetPeekTopY(h);
  /** 핸들 + 첫 카드 1줄 분량 높이 */
  const sheetHeight = Math.round(Math.min(Math.max(h * 0.26, 180), Math.min(h * 0.34, 260)));
  let top = h - sheetHeight;
  top = Math.max(top, peekTwoTop + 24);
  top = Math.min(top, h - 60);
  if (top <= peekTwoTop) top = Math.min(peekTwoTop + 28, h - 60);
  if (top <= mid) top = Math.min(mid + 40, h - 60);
  return Math.round(top);
}

export function getSnapAnchors(viewportHeight: number) {
  const h = viewportHeight;
  const minY = AI_BOTTOM_SHEET_MIN_TOP;
  const midY = getAiBottomSheetMidTopY(h);
  let peekTwoY = getAiBottomSheetPeekTopY(h);
  if (peekTwoY <= midY) {
    peekTwoY = Math.min(midY + 36, h - 120);
  }
  let peekOneY = getAiBottomSheetPeekOneTopY(h);
  if (peekOneY <= peekTwoY) {
    peekOneY = Math.min(peekTwoY + 32, h - 60);
  }
  return { minY, midY, peekTwoY, peekOneY };
}

function snapToNearestAnchor(topY: number, viewportHeight: number): number {
  const { minY, midY, peekTwoY, peekOneY } = getSnapAnchors(viewportHeight);
  const stops = [minY, midY, peekTwoY, peekOneY];
  return stops.reduce((best, s) => (Math.abs(topY - s) < Math.abs(topY - best) ? s : best));
}

type MovingDirection = "none" | "down" | "up";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function dragBounds(h: number) {
  const { minY, peekOneY } = getSnapAnchors(h);
  return { rangeMin: minY, rangeMax: peekOneY };
}

function canUserMoveSheet(opts: {
  sheetTop: number;
  minAnchor: number;
  scrollTop: number;
  isContentTouch: boolean;
  movingDirection: MovingDirection;
}) {
  const { sheetTop, minAnchor, scrollTop, isContentTouch, movingDirection } = opts;

  if (isContentTouch && scrollTop > 0) {
    return false;
  }

  if (Math.abs(sheetTop - minAnchor) > 1) {
    return true;
  }

  if (movingDirection === "down") {
    return scrollTop <= 0;
  }

  return false;
}

export function useAiSearchBottomSheet() {
  const sheetRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const vpInit = typeof window !== "undefined" ? window.innerHeight : 667;
  const { midY: initialMid } = getSnapAnchors(vpInit);

  const [sheetTopY, setSheetTopY] = useState(initialMid);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartSheetYRef = useRef(0);
  const touchStartFingerYRef = useRef(0);
  const prevFingerYRef = useRef(0);
  const dirRef = useRef<MovingDirection>("none");
  const draggingRef = useRef(false);
  const contentTouchedRef = useRef(false);

  const snapNearest = useCallback((topY: number) => {
    const h = typeof window !== "undefined" ? window.innerHeight : 667;
    return snapToNearestAnchor(topY, h);
  }, []);

  const togglePhase = useCallback(() => {
    const h = typeof window !== "undefined" ? window.innerHeight : 667;
    const { minY, midY, peekTwoY, peekOneY } = getSnapAnchors(h);
    const cycle = [minY, midY, peekTwoY, peekOneY];
    setSheetTopY((prev) => {
      const idx = cycle.findIndex((y) => Math.abs(prev - y) < 16);
      const i = idx === -1 ? 1 : idx;
      return cycle[(i + 1) % cycle.length];
    });
  }, []);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el || draggingRef.current) return;
    el.style.top = `${sheetTopY}px`;
    el.style.bottom = "0";
  }, [sheetTopY]);

  useEffect(() => {
    const onResize = () => {
      const h = window.innerHeight;
      const { rangeMin, rangeMax } = dragBounds(h);
      setSheetTopY((p) => {
        const c = clamp(p, rangeMin, rangeMax);
        return snapToNearestAnchor(c, h);
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    const content = contentRef.current;
    if (!sheet || !content) return;

    const onSheetTouchStart = (e: TouchEvent) => {
      const t = e.target as Node | null;
      contentTouchedRef.current = !!(
        t &&
        content.contains(t) &&
        !(t instanceof Element && t.closest("[data-ai-sheet-handle]"))
      );

      const finger = e.touches[0];
      touchStartSheetYRef.current = sheet.getBoundingClientRect().y;
      touchStartFingerYRef.current = finger.clientY;
      prevFingerYRef.current = finger.clientY;
      dirRef.current = "none";
      draggingRef.current = true;
      setIsDragging(true);
    };

    const onSheetTouchMove = (e: TouchEvent) => {
      const finger = e.touches[0];
      const pf = prevFingerYRef.current;
      if (finger.clientY > pf) {
        dirRef.current = "down";
      } else if (finger.clientY < pf) {
        dirRef.current = "up";
      }
      prevFingerYRef.current = finger.clientY;

      const h = window.innerHeight;
      const { rangeMin, rangeMax } = dragBounds(h);
      const sheetY = sheet.getBoundingClientRect().y;

      const offset = finger.clientY - touchStartFingerYRef.current;
      let nextSheetY = touchStartSheetYRef.current + offset;
      nextSheetY = clamp(nextSheetY, rangeMin, rangeMax);

      if (
        !canUserMoveSheet({
          sheetTop: sheetY,
          minAnchor: rangeMin,
          scrollTop: content.scrollTop,
          isContentTouch: contentTouchedRef.current,
          movingDirection: dirRef.current,
        })
      ) {
        return;
      }

      sheet.style.top = `${nextSheetY}px`;
    };

    const onSheetTouchEnd = () => {
      const top = sheet.getBoundingClientRect().y;
      const h = typeof window !== "undefined" ? window.innerHeight : 667;
      const snapped = snapToNearestAnchor(top, h);
      draggingRef.current = false;
      setSheetTopY(snapped);
      sheet.style.top = `${snapped}px`;
      setIsDragging(false);
      contentTouchedRef.current = false;
      dirRef.current = "none";
      document.body.style.overflowY = "";
    };

    sheet.addEventListener("touchstart", onSheetTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onSheetTouchMove, { passive: true });
    sheet.addEventListener("touchend", onSheetTouchEnd);
    sheet.addEventListener("touchcancel", onSheetTouchEnd);

    return () => {
      sheet.removeEventListener("touchstart", onSheetTouchStart);
      sheet.removeEventListener("touchmove", onSheetTouchMove);
      sheet.removeEventListener("touchend", onSheetTouchEnd);
      sheet.removeEventListener("touchcancel", onSheetTouchEnd);
    };
  }, [snapNearest]);

  const vh = typeof window !== "undefined" ? window.innerHeight : 667;
  const { midY } = getSnapAnchors(vh);
  const isHalfSheet = sheetTopY >= (AI_BOTTOM_SHEET_MIN_TOP + midY) / 2;

  return {
    sheetRef,
    contentRef,
    sheetTopY,
    isDragging,
    isHalfSheet,
    togglePhase,
  };
}
