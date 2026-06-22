import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MobileFrame from "@/components/layout/MobileFrame";
import LandingRunnerScene from "./LandingRunnerScene";

const FADE_OUT_MS = 400;

/** AI 코스 추천·빵투어·빵택시를 아우르는 메인 카피 */
const SERVICE_TAGLINE = "취향에 맞는 빵집 코스를 추천해드려요";
const SERVICE_SUBLINE = "빵택시가 최고의 코스를 찾고 있어요";

type LandingIntroProps = {
  durationMs: number;
  onComplete?: () => void;
};

export default function LandingIntro({ durationMs, onComplete }: LandingIntroProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(
      () => {
        setIsExiting(true);
      },
      Math.max(0, durationMs - FADE_OUT_MS),
    );

    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, durationMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <MobileFrame>
      <motion.main
        className="relative flex min-h-screen flex-1 flex-col bg-gradient-to-b from-[#FFF8F0] via-[#FFF3E6] to-[#FFEFD8] px-x5 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(48px,env(safe-area-inset-top))]"
        initial={{ opacity: 1 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: FADE_OUT_MS / 1000, ease: "easeOut" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div
            className="flex w-full flex-col items-center gap-x6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <LandingRunnerScene />

            <div className="flex flex-col items-center gap-x1-5">
              <h1 className="font-pretendard text-size-7 font-bold leading-t8 tracking-2 text-gray-1000">
                빵빵
              </h1>
              <p className="max-w-[300px] font-pretendard text-size-4 font-medium leading-t5 tracking-1 text-gray-800">
                {SERVICE_TAGLINE}
              </p>
              <p className="max-w-[300px] font-pretendard text-size-3 font-medium leading-t4 tracking-1 text-orange-700/85">
                {SERVICE_SUBLINE}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </MobileFrame>
  );
}
