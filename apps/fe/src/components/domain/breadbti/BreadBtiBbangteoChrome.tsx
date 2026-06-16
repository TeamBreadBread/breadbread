import { useNavigate } from "@tanstack/react-router";

import { AppIcon, IconAssets } from "@/components/icons";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import { clearBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";
import { navigateBackToAiCourseFromBreadBti } from "@/utils/navigateBackToAiCourseFromBreadBti";

export function BreadBtiBbangteoBackHeader() {
  const navigate = useNavigate();

  const goBack = () => {
    clearBreadBtiEntryFrom();
    void navigate({ to: "/bbangteo" });
  };

  return (
    <>
      <header className={`${BBANGTEO_FIXED_HEADER_OUTER_CLASS} bg-white/95 backdrop-blur-sm`}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={goBack}
            aria-label="빵터로 돌아가기"
          >
            <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="" />
          </button>
          <span className="text-[16px] font-bold text-[#D86A00]">Bread BTI</span>
          <div className="h-[36px] w-[36px] shrink-0" aria-hidden />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
}

export function BreadBtiAiGeneratingBackHeader() {
  const navigate = useNavigate();

  const goBack = () => {
    void navigateBackToAiCourseFromBreadBti(navigate).then(() => {
      clearBreadBtiEntryFrom();
    });
  };

  return (
    <>
      <header className={`${BBANGTEO_FIXED_HEADER_OUTER_CLASS} bg-white/95 backdrop-blur-sm`}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={goBack}
            aria-label="AI 코스 생성으로 돌아가기"
          >
            <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="" />
          </button>
          <span className="text-[16px] font-bold text-[#D86A00]">Bread BTI</span>
          <div className="h-[36px] w-[36px] shrink-0" aria-hidden />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
}

export function BreadBtiBbangteoBottomNav() {
  return <BottomNav />;
}
