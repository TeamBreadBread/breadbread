import { useNavigate } from "@tanstack/react-router";

import { BREAD_BTI_HOME_IMAGE } from "@/lib/breadbti/images";
import { markBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";
import { saveAiCourseBtiReturnJobId, saveAiCoursePendingJobId } from "@/utils/aiCourseStorage";
type BreadBtiLoadingPromptProps = {
  jobId: string;
};

/** AI 코스 생성 대기 중 BreadBTI 유도 카드 */
export default function BreadBtiLoadingPrompt({ jobId }: BreadBtiLoadingPromptProps) {
  const navigate = useNavigate();

  const goToBreadBti = () => {
    const trimmedJobId = jobId.trim();
    if (trimmedJobId && trimmedJobId !== "preview") {
      saveAiCourseBtiReturnJobId(trimmedJobId);
      saveAiCoursePendingJobId(trimmedJobId);
    }
    markBreadBtiEntryFrom("ai-generating");
    void navigate({ to: "/breadbti", search: { from: "ai-generating", jobId: trimmedJobId } });
  };
  return (
    <div className="w-full max-w-[320px] rounded-r2 border border-[#ffd4a8] bg-gradient-to-br from-[#fff4e6] to-[#ffe8cc] px-x4 py-x4">
      <div className="flex items-center gap-x3">
        <img
          src={BREAD_BTI_HOME_IMAGE}
          alt=""
          aria-hidden
          className="h-[52px] w-[52px] shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="font-pretendard text-size-3 font-medium text-[#B87333]">기다리는 동안</p>
          <p className="font-pretendard text-size-4 font-bold leading-t5 text-[#D86A00]">
            나는 어떤 빵 타입일까?
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={goToBreadBti}
        className="mt-x3 h-[44px] w-full rounded-r2 bg-[#FF8C42] font-pretendard text-size-3 font-bold text-white transition-colors hover:bg-[#FF7A10] active:scale-[0.99]"
      >
        BreadBTI 하러가기
      </button>
    </div>
  );
}
