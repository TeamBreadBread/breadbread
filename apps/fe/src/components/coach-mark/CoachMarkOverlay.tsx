import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/common";
import type { CoachMarkStep } from "@/components/coach-mark/coachMarkConfig";
import { COACH_MARK_SPOTLIGHT_PADDING } from "@/components/coach-mark/coachMarkConfig";
import type { SpotlightRect } from "@/components/coach-mark/coachMarkSpotlight";
import { cn } from "@/utils/cn";

type CoachMarkOverlayProps = {
  open: boolean;
  stepIndex: number;
  step: CoachMarkStep;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
};

function CoachMarkCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5L10 17.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function measureTargetInContainer(
  targetSelector: string,
  container: HTMLElement,
  radius: number,
): SpotlightRect | null {
  const target = document.querySelector<HTMLElement>(`[data-coach-target="${targetSelector}"]`);
  if (!target) return null;

  const targetRect = target.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const padding = COACH_MARK_SPOTLIGHT_PADDING;

  return {
    x: targetRect.left - containerRect.left - padding,
    y: targetRect.top - containerRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    radius,
  };
}

export default function CoachMarkOverlay({
  open,
  stepIndex,
  step,
  totalSteps,
  onNext,
  onSkip,
}: CoachMarkOverlayProps) {
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const isFinish = step.id === "finish";

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    if (!step.target) {
      setSpotlight(null);
      return;
    }

    setSpotlight(measureTargetInContainer(step.target, container, step.spotlightRadius ?? 8));
  }, [step]);

  useEffect(() => {
    if (!open) return;

    measure();
    const raf = window.requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 150);

    const handleLayoutChange = () => measure();
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [measure, open, stepIndex]);

  const maskStyle = useMemo(() => {
    if (isFinish || !spotlight || containerSize.width <= 0 || containerSize.height <= 0) {
      return undefined;
    }

    const { x, y, width, height, radius } = spotlight;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${containerSize.width}" height="${containerSize.height}"><defs><mask id="m"><rect width="100%" height="100%" fill="white"/><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="black"/></mask></defs><rect width="100%" height="100%" fill="white" mask="url(#m)"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [containerSize.height, containerSize.width, isFinish, spotlight]);

  const cardStyle = useMemo(() => {
    if (isFinish) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(300px, calc(100% - 40px))",
      } as const;
    }

    if (!spotlight) {
      return {
        bottom: 88,
        left: 20,
        right: 20,
      } as const;
    }

    const cardEstimatedHeight = 200;
    const belowTop = spotlight.y + spotlight.height + 12;
    const fitsBelow = belowTop + cardEstimatedHeight < containerSize.height - 72;

    if (fitsBelow) {
      return {
        top: belowTop,
        left: 20,
        right: 20,
      } as const;
    }

    return {
      bottom: containerSize.height - spotlight.y + 12,
      left: 20,
      right: 20,
    } as const;
  }, [containerSize.height, isFinish, spotlight]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip, open]);

  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
  }, [open, stepIndex]);

  if (!open) return null;

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[350] flex justify-center"
      role="presentation"
    >
      <div ref={containerRef} className="relative h-full w-full max-w-[402px]">
        <div
          className="absolute inset-0 bg-[rgba(26,31,39,0.72)]"
          style={
            maskStyle
              ? {
                  WebkitMaskImage: maskStyle,
                  maskImage: maskStyle,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }
              : undefined
          }
          aria-hidden
        />

        {spotlight && !isFinish ? (
          <div
            className="pointer-events-none absolute transition-all duration-300 ease-out"
            style={{
              left: spotlight.x,
              top: spotlight.y,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: spotlight.radius,
              boxShadow: "0 0 0 2px var(--color-orange-600), 0 0 0 6px rgba(255,134,72,0.24)",
            }}
            aria-hidden
          />
        ) : null}

        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          className={cn(
            "absolute z-[1] flex flex-col overflow-hidden rounded-r4 bg-gray-00 shadow-3",
            !isFinish && "animate-[coachMarkFadeUp_280ms_ease-out]",
            isFinish ? "items-center gap-x6 p-x6" : "gap-x4 p-x5",
          )}
          style={cardStyle}
        >
          {isFinish ? (
            <>
              <div className="flex h-x12 w-x12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <CoachMarkCheckIcon />
              </div>
              <div className="flex w-full flex-col items-center gap-x1-5 text-center">
                <span className="rounded-full bg-orange-100 px-x2 py-x1 font-pretendard text-size-1 font-medium leading-t2 text-gray-700">
                  {step.badge}
                </span>
                <h2
                  id={titleId}
                  className="font-pretendard text-size-5 font-bold leading-t6 tracking-1 text-gray-1000"
                >
                  {step.title}
                </h2>
                <p
                  id={bodyId}
                  className="whitespace-pre-line font-pretendard text-size-4 leading-t5 tracking-0 text-gray-800"
                >
                  {step.body}
                </p>
              </div>
              <Button type="button" fullWidth onClick={onNext}>
                {step.primaryLabel}
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-x2">
                <span className="w-fit rounded-full bg-orange-100 px-x2 py-x1 font-pretendard text-size-1 font-medium leading-t2 text-gray-700">
                  {step.badge}
                </span>
                <h2
                  id={titleId}
                  className="font-pretendard text-size-4 font-bold leading-t5 tracking-1 text-gray-1000"
                >
                  {step.title}
                </h2>
                <p
                  id={bodyId}
                  className="font-pretendard text-size-3 leading-t4 tracking-0 text-gray-800"
                >
                  {step.body}
                </p>
              </div>

              <div className="flex items-center justify-between gap-x3 border-t border-gray-300 pt-x4">
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-x11 min-w-x11 font-pretendard text-size-2 font-medium leading-t3 text-gray-700"
                >
                  건너뛰기
                </button>

                <div className="flex items-center gap-x1-5" aria-hidden>
                  {Array.from({ length: totalSteps }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-x1-5 w-x1-5 rounded-full transition-colors duration-200",
                        index === stepIndex ? "bg-orange-600" : "bg-gray-400",
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  className="!h-x11 !min-w-[72px] !px-x4 !py-x2 !text-size-3"
                  onClick={onNext}
                >
                  {step.primaryLabel}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
