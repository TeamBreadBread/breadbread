import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import BreadBtiLoadingPrompt from "@/components/domain/breadbti/BreadBtiLoadingPrompt";
import { getErrorMessage } from "@/api/types/common";
import { AI_COURSE_ESTIMATED_WAIT_SECONDS } from "@/utils/pollAiCourseStatus";
import { clearAiCoursePendingJobId, saveAiCoursePendingJobId } from "@/utils/aiCourseStorage";
import { finalizeAiCourseJob } from "@/utils/finalizeAiCourseJob";

type AiCourseGeneratingPageProps = {
  jobId: string;
};

/** React StrictMode(dev)에서 동일 jobId 폴링이 두 번 시작되는 것을 막는다. */
const aiCoursePollStartedJobIds = new Set<string>();

function logAiCourseGenerationFailure(jobId: string, error: unknown): void {
  const message = getErrorMessage(error);
  // eslint-disable-next-line no-console
  console.error(`[AI 코스 생성 실패] ${message}`, {
    jobId,
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export default function AiCourseGeneratingPage({ jobId }: AiCourseGeneratingPageProps) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const [secondsLeft, setSecondsLeft] = useState(AI_COURSE_ESTIMATED_WAIT_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    saveAiCoursePendingJobId(jobId);
  }, [jobId]);

  useEffect(() => {
    if (errorMessage) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (aiCoursePollStartedJobIds.has(jobId)) return undefined;
    aiCoursePollStartedJobIds.add(jobId);

    let cancelled = false;

    void (async () => {
      try {
        const courseId = await finalizeAiCourseJob(jobId);
        if (cancelled) return;
        navigateRef.current({ to: "/ai-search-result", search: { courseId } });
      } catch (e) {
        if (cancelled) return;
        logAiCourseGenerationFailure(jobId, e);
        clearAiCoursePendingJobId();
        setErrorMessage(getErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
      aiCoursePollStartedJobIds.delete(jobId);
    };
  }, [jobId]);

  if (errorMessage) {
    return (
      <MobileFrame className="flex min-h-screen flex-col bg-white">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24">
          <p className="text-center font-pretendard text-lg font-semibold text-gray-1000">
            AI 코스 생성에 실패했어요
          </p>

          <div className="w-full max-w-[320px] rounded-r2 border border-gray-200 bg-gray-50 px-x4 py-x4">
            <p className="font-pretendard text-size-3 font-medium text-gray-500">오류 메시지</p>
            <p className="mt-x1 break-words font-pretendard text-size-4 leading-t5 text-gray-900">
              {errorMessage}
            </p>
            <p className="mt-x2 break-all font-pretendard text-size-2 leading-t4 text-gray-400">
              jobId: {jobId}
            </p>
          </div>

          <div className="flex w-full max-w-[320px] flex-col gap-x2">
            <button
              type="button"
              className="h-[52px] w-full rounded-r2 bg-orange-600 font-pretendard text-size-4 font-semibold text-white"
              onClick={() => navigate({ to: "/recommendation" })}
            >
              다시 시도하기
            </button>
            <button
              type="button"
              className="h-[52px] w-full rounded-r2 border border-gray-200 bg-white font-pretendard text-size-4 font-medium text-gray-700"
              onClick={() => navigate({ to: "/home" })}
            >
              홈으로 가기
            </button>
          </div>
        </main>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24">
        <p className="text-center font-pretendard text-lg font-semibold text-gray-1000">
          AI 코스를 생성하고 있어요
        </p>

        <div
          className="size-14 shrink-0 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800"
          role="status"
          aria-label="AI 코스 생성 중"
        />

        <p className="max-w-[280px] text-center font-pretendard text-size-4 leading-t5 text-gray-700">
          {secondsLeft > 0 ? (
            <>
              예상 대기 시간
              <br />약 <span className="font-semibold text-gray-900">{secondsLeft}초</span> 남음
            </>
          ) : (
            <>거의 완료되었어요. 조금만 더 기다려 주세요.</>
          )}
        </p>

        <BreadBtiLoadingPrompt />
      </main>
    </MobileFrame>
  );
}
