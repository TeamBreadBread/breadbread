import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import leadingLogo from "@/assets/icons/Leading.svg";

const RUN_SECONDS = 2.75;
const TAXI_WIDTH = 72;
const TRACK_PADDING = 16;

const BREAD_EMOJIS = ["🍞", "🥐", "🥖", "🥯", "🍩", "🧁", "🥨"] as const;

const COIN_CENTER_RATIOS = [0.4, 0.68] as const;

type TrackLayout = {
  width: number;
  startX: number;
  endX: number;
};

function pickRandomEmojis(count: number): string[] {
  const pool = [...BREAD_EMOJIS];
  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * pool.length);
    return pool[index] ?? "🍞";
  });
}

function collectProgress(layout: TrackLayout, centerRatio: number): number {
  const { width, startX, endX } = layout;
  const travel = endX - startX;
  if (travel <= 0) return 0.5;

  const centerX = TRACK_PADDING + (width - TRACK_PADDING * 2) * centerRatio;
  const taxiLeftAtCollect = centerX - TAXI_WIDTH / 2;
  return (taxiLeftAtCollect - startX) / travel;
}

type CollectibleCoinProps = {
  emoji: string;
  left: string;
  collectAt: number;
};

function CollectibleCoin({ emoji, left, collectAt }: CollectibleCoinProps) {
  const safeCollect = Math.min(0.92, Math.max(0.08, collectAt));

  return (
    <motion.span
      className="absolute bottom-[23px] -translate-x-1/2 select-none text-[28px] leading-none"
      style={{ left }}
      initial={{ opacity: 1, scale: 1, y: 0 }}
      animate={{
        opacity: [1, 1, 0, 0],
        scale: [1, 1.15, 0.5, 0.5],
        y: [0, 0, -22, -22],
      }}
      transition={{
        duration: RUN_SECONDS,
        times: [0, safeCollect, safeCollect + 0.08, 1],
        ease: "easeOut",
      }}
    >
      {emoji}
    </motion.span>
  );
}

export default function LandingRunnerScene() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [emojis] = useState(() => pickRandomEmojis(COIN_CENTER_RATIOS.length));
  const [layout, setLayout] = useState<TrackLayout | null>(null);

  const coins = useMemo(
    () =>
      COIN_CENTER_RATIOS.map((ratio, index) => ({
        left: `${ratio * 100}%`,
        emoji: emojis[index] ?? "🍞",
        ratio,
      })),
    [emojis],
  );

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

  return (
    <div
      ref={trackRef}
      className="relative h-[148px] w-full max-w-[340px] overflow-hidden rounded-r3 border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-200/80"
      aria-hidden
    >
      <div className="absolute inset-x-0 bottom-[22px] h-[2px] bg-gray-400" />

      <div className="absolute inset-x-0 bottom-[26px] h-3 overflow-hidden opacity-35">
        <motion.div
          className="flex w-max gap-5"
          animate={{ x: [0, -80] }}
          transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 30 }).map((_, index) => (
            <span key={index} className="inline-block h-1 w-2 rounded-full bg-gray-600" />
          ))}
        </motion.div>
      </div>

      {layout
        ? coins.map((coin, index) => (
            <CollectibleCoin
              key={`${layout.width}-${index}-${coin.emoji}`}
              emoji={coin.emoji}
              left={coin.left}
              collectAt={collectProgress(layout, coin.ratio)}
            />
          ))
        : null}

      {layout ? (
        <motion.div
          className="absolute bottom-[24px] left-0"
          initial={{ x: layout.startX }}
          animate={{ x: [layout.startX, layout.endX] }}
          transition={{ duration: RUN_SECONDS, ease: "linear" }}
        >
          <motion.img
            src={leadingLogo}
            alt=""
            className="h-[46px] w-[72px] object-contain drop-shadow-[0_6px_10px_rgba(55,18,0,0.2)]"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      ) : (
        <div className="absolute bottom-[24px]" style={{ left: TRACK_PADDING }}>
          <img src={leadingLogo} alt="" className="h-[46px] w-[72px] object-contain" />
        </div>
      )}
    </div>
  );
}
