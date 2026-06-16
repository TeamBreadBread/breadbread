import type { ReactNode } from "react";
import MobileFrame from "@/components/layout/MobileFrame";
import BreadBtiAiGeneratingReturnBar from "@/components/domain/breadbti/BreadBtiAiGeneratingReturnBar";
import {
  BreadBtiAiGeneratingBackHeader,
  BreadBtiBbangteoBackHeader,
  BreadBtiBbangteoBottomNav,
} from "@/components/domain/breadbti/BreadBtiBbangteoChrome";
import { isBreadBtiFromAiGenerating, isBreadBtiFromBbangteo } from "@/lib/breadbti/entryFrom";
import { cn } from "@/utils/cn";

type BreadBtiMobileFrameProps = {
  children: ReactNode;
  className?: string;
  /** 미지정 시 sessionStorage(`breadbti:entry-from`)로 판별 */
  fromBbangteo?: boolean;
  fromAiGenerating?: boolean;
};

/** BreadBTI 전용 — 데스크탑에서도 402px 모바일 셸로 표시 */
export default function BreadBtiMobileFrame({
  children,
  className,
  fromBbangteo,
  fromAiGenerating,
}: BreadBtiMobileFrameProps) {
  const showBbangteoChrome = fromBbangteo ?? isBreadBtiFromBbangteo();
  const showAiGeneratingChrome =
    !showBbangteoChrome && (fromAiGenerating ?? isBreadBtiFromAiGenerating());

  return (
    <MobileFrame
      className={cn(
        "relative flex min-h-screen flex-col bg-gradient-to-b from-[#FFF4E6] to-[#FFE8CC]",
        className,
      )}
    >
      {showBbangteoChrome ? <BreadBtiBbangteoBackHeader /> : null}
      {showAiGeneratingChrome ? <BreadBtiAiGeneratingBackHeader /> : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          showBbangteoChrome && "pb-[114px] sm:pb-[118px]",
          showAiGeneratingChrome && "pb-[76px]",
        )}
      >
        {children}
      </div>
      {showBbangteoChrome ? <BreadBtiBbangteoBottomNav /> : null}
      {showAiGeneratingChrome ? <BreadBtiAiGeneratingReturnBar /> : null}
    </MobileFrame>
  );
}
