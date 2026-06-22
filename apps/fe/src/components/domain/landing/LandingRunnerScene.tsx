import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import leadingLogo from "@/assets/icons/Leading.svg";
import icCheckCircleGreen from "@/assets/icons/Ic_CheckCircle_Green.svg";
import { AppIcon, IconAssets } from "@/components/icons";

const RUN_SECONDS = 2.75;
const TAXI_WIDTH = 72;
const TRACK_PADDING = 20;
const SCENE_HEIGHT = 188;
const PATH_Y = 118;

const COURSE_STOPS = [
  { name: "성심당", ratio: 0.24 },
  { name: "하레하레", ratio: 0.52 },
  { name: "콜마르브레", ratio: 0.8 },
] as const;

type TrackLayout = {
  width: number;
  startX: number;
  endX: number;
};

function stopX(layout: TrackLayout, ratio: number): number {
  return TRACK_PADDING + (layout.width - TRACK_PADDING * 2) * ratio;
}

function visitProgress(layout: TrackLayout, ratio: number): number {
  const { startX, endX } = layout;
  const travel = endX - startX;
  if (travel <= 0) return 0.5;
  const centerX = stopX(layout, ratio);
  const taxiLeftAtVisit = centerX - TAXI_WIDTH / 2;
  return (taxiLeftAtVisit - startX) / travel;
}

type CoursePathProps = {
  layout: TrackLayout;
  stopRatios: readonly number[];
};

function CoursePath({ layout, stopRatios }: CoursePathProps) {
  const { width, startX, endX } = layout;
  const stopPoints = stopRatios.map((ratio) => stopX(layout, ratio));
  const pathD = [
    `M ${startX} ${PATH_Y}`,
    ...stopPoints.map((x) => `L ${x} ${PATH_Y}`),
    `L ${endX} ${PATH_Y}`,
  ].join(" ");

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={SCENE_HEIGHT}
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke="#FB923C"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx={startX} cy={PATH_Y} r="4" fill="#FB923C" opacity="0.85" />
      <circle cx={endX} cy={PATH_Y} r="4" fill="#EA580C" opacity="0.85" />
    </svg>
  );
}

const FIREWORK_COLORS = ["#FB923C", "#F97316", "#FBBF24", "#FDE047", "#EA580C", "#EF476F"] as const;
const FIREWORK_PARTICLE_COUNT = 18;

type FireworkParticle = {
  id: number;
  angle: number;
  dist: number;
  size: number;
  color: string;
};

function createFireworkParticles(): FireworkParticle[] {
  return Array.from({ length: FIREWORK_PARTICLE_COUNT }, (_, id) => ({
    id,
    angle: (id / FIREWORK_PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
    dist: 26 + Math.random() * 22,
    size: 4 + Math.random() * 4,
    color: FIREWORK_COLORS[id % FIREWORK_COLORS.length]!,
  }));
}

type LandingCourseFireworksProps = {
  leftPx: number;
  bottomPx: number;
  active: boolean;
};

function LandingCourseFireworks({ leftPx, bottomPx, active }: LandingCourseFireworksProps) {
  const [particles] = useState(createFireworkParticles);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange-400/70"
        style={{ left: leftPx, bottom: bottomPx }}
        initial={{ width: 8, height: 8, opacity: 0.9 }}
        animate={{ width: 56, height: 56, opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/40"
        style={{ left: leftPx, bottom: bottomPx }}
        initial={{ width: 6, height: 6, opacity: 0.85 }}
        animate={{ width: 36, height: 36, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute block rounded-full"
          style={{
            left: leftPx,
            bottom: bottomPx,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 6px ${particle.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
          animate={{
            x: Math.cos(particle.angle) * particle.dist,
            y: Math.sin(particle.angle) * particle.dist - 10,
            opacity: [1, 1, 0],
            scale: [0.6, 1.15, 0.4],
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

type BakeryStopProps = {
  name: string;
  leftPx: number;
  visitAt: number;
};

function BakeryStop({ name, leftPx, visitAt }: BakeryStopProps) {
  const safeVisit = Math.min(0.92, Math.max(0.08, visitAt));

  return (
    <div
      className="absolute bottom-[52px] flex -translate-x-1/2 flex-col items-center gap-x1"
      style={{ left: leftPx }}
    >
      <motion.div
        className="max-w-[88px] truncate rounded-r2 border bg-white/90 px-x2 py-[3px] font-pretendard text-[11px] font-semibold leading-tight text-gray-800 shadow-[0_2px_8px_rgba(234,88,12,0.12)]"
        initial={{ opacity: 0.85, scale: 1, borderColor: "#FED7AA" }}
        animate={{
          opacity: [0.85, 0.85, 1, 1],
          scale: [1, 1, 1.08, 1.04],
          borderColor: ["#FED7AA", "#FED7AA", "#FB923C", "#FB923C"],
          color: ["#2A3038", "#2A3038", "#9A3412", "#9A3412"],
        }}
        transition={{
          duration: RUN_SECONDS,
          times: [0, safeVisit, safeVisit + 0.06, 1],
          ease: "easeOut",
        }}
      >
        {name}
      </motion.div>

      <div className="relative flex h-[28px] w-[28px] items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1, 1.18, 1.1],
            opacity: [0.55, 0.55, 1, 1],
          }}
          transition={{
            duration: RUN_SECONDS,
            times: [0, safeVisit, safeVisit + 0.06, 1],
            ease: "easeOut",
          }}
        >
          <AppIcon src={IconAssets.IcPin} size={22} className="icon-orange-600" alt="" />
        </motion.div>

        <motion.div
          className="absolute -right-1 -top-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white shadow-sm"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0, 1, 1],
            scale: [0, 0, 1.1, 1],
          }}
          transition={{
            duration: RUN_SECONDS,
            times: [0, safeVisit + 0.02, safeVisit + 0.08, 1],
            ease: "easeOut",
          }}
        >
          <AppIcon src={icCheckCircleGreen} size={14} alt="" />
        </motion.div>
      </div>
    </div>
  );
}

export default function LandingRunnerScene() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<TrackLayout | null>(null);
  const [celebratedStopKey, setCelebratedStopKey] = useState<string | null>(null);

  const stops = useMemo(
    () =>
      layout
        ? COURSE_STOPS.map((stop) => ({
            ...stop,
            leftPx: stopX(layout, stop.ratio),
            visitAt: visitProgress(layout, stop.ratio),
          }))
        : [],
    [layout],
  );

  const finalStop = stops[stops.length - 1];
  const fireworksStopKey = finalStop ? `${finalStop.leftPx}:${finalStop.visitAt.toFixed(4)}` : null;
  const showFireworks = fireworksStopKey !== null && celebratedStopKey === fireworksStopKey;

  useLayoutEffect(() => {
    const measure = () => {
      const width = trackRef.current?.clientWidth ?? 340;
      setLayout({
        width,
        startX: TRACK_PADDING,
        endX: width - TRACK_PADDING - TAXI_WIDTH,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!finalStop || !fireworksStopKey) return;

    const delayMs = finalStop.visitAt * RUN_SECONDS * 1000;
    const timer = window.setTimeout(() => {
      setCelebratedStopKey(fireworksStopKey);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [finalStop, fireworksStopKey]);

  return (
    <div
      ref={trackRef}
      className="relative w-full max-w-[340px] overflow-visible rounded-r4 border border-orange-200/80 bg-white shadow-[0_4px_20px_rgba(234,88,12,0.08)]"
      style={{ height: SCENE_HEIGHT }}
      aria-hidden
    >
      <div className="absolute inset-x-x3 top-x3 flex items-center justify-between font-pretendard text-[10px] font-semibold tracking-wide text-orange-700/70">
        <span>출발</span>
        <span className="rounded-full bg-orange-100/80 px-x2 py-[2px] text-orange-800">
          빵투어 코스
        </span>
        <span>완료</span>
      </div>

      {layout ? (
        <>
          <CoursePath layout={layout} stopRatios={COURSE_STOPS.map((s) => s.ratio)} />
          {stops.map((stop) => (
            <BakeryStop
              key={stop.name}
              name={stop.name}
              leftPx={stop.leftPx}
              visitAt={stop.visitAt}
            />
          ))}

          {finalStop ? (
            <LandingCourseFireworks
              leftPx={finalStop.leftPx}
              bottomPx={66}
              active={showFireworks}
            />
          ) : null}

          <motion.div
            className="absolute left-0"
            style={{ bottom: PATH_Y - 24 }}
            initial={{ x: layout.startX }}
            animate={{ x: [layout.startX, layout.endX] }}
            transition={{ duration: RUN_SECONDS, ease: "linear" }}
          >
            <motion.img
              src={leadingLogo}
              alt=""
              className="h-[46px] w-[72px] object-contain drop-shadow-[0_6px_12px_rgba(234,88,12,0.25)]"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </>
      ) : (
        <div className="absolute bottom-[94px]" style={{ left: TRACK_PADDING }}>
          <img src={leadingLogo} alt="" className="h-[46px] w-[72px] object-contain" />
        </div>
      )}
    </div>
  );
}
