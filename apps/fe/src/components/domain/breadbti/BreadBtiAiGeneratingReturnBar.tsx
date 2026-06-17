import { useNavigate } from "@tanstack/react-router";

import { useBreadBtiAiReturnJobId } from "@/hooks/useBreadBtiAiReturnJobId";
import { isBreadBtiFromAiGenerating, clearBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";
import { navigateBackToAiCourseFromBreadBti } from "@/utils/navigateBackToAiCourseFromBreadBti";

/** AI 코스 생성 중 BreadBTI 이용 시 하단 고정 복귀 버튼 */
export default function BreadBtiAiGeneratingReturnBar() {
  const navigate = useNavigate();
  const returnJobId = useBreadBtiAiReturnJobId();

  if (!isBreadBtiFromAiGenerating()) return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(env(safe-area-inset-bottom),12px)] left-1/2 z-[50] w-full max-w-[402px] -translate-x-1/2 px-5">
      <button
        type="button"
        onClick={() => {
          void navigateBackToAiCourseFromBreadBti(navigate, returnJobId).then(() => {
            clearBreadBtiEntryFrom();
          });
        }}
        className="pointer-events-auto h-[48px] w-full rounded-full bg-[#FF8C42] font-pretendard text-size-3 font-bold text-white shadow-[0_4px_16px_rgba(255,140,66,0.35)] transition-colors hover:bg-[#FF7A10] active:scale-[0.99]"
      >
        AI 코스 생성 화면으로 돌아가기
      </button>
    </div>
  );
}
