import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import BreadBtiLoadingPrompt from "@/components/domain/breadbti/BreadBtiLoadingPrompt";
import PreferenceTopBar from "@/components/domain/ai-course/PreferenceTopBar";
import { getErrorMessage } from "@/api/types/common";
import { AI_COURSE_ESTIMATED_WAIT_SECONDS } from "@/utils/pollAiCourseStatus";
import { isPreferenceNotFoundError } from "@/utils/aiCoursePreference";
import { clearAiCourseJobContext } from "@/utils/clearAiCourseJobContext";
import {
  readAiCourseBtiReturnJobId,
  readAiCourseJobCourseId,
  readAiCoursePreferenceDraft,
  saveAiCoursePendingJobId,
} from "@/utils/aiCourseStorage";
import { isAiJobNotFoundError, resolveAiCourseJobCourseId } from "@/utils/aiCourseJobRunner";
import { resumeAiCourseGeneration } from "@/utils/navigateBackToAiCourseFromBreadBti";

type AiCourseGeneratingPageProps = {
  jobId: string;
  /** localhost 등에서 UI 확인용 — API 폴링 없이 로딩 화면만 표시 */
  preview?: boolean;
};

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

export default function AiCourseGeneratingPage({
  jobId,
  preview = false,
}: AiCourseGeneratingPageProps) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const [secondsLeft, setSecondsLeft] = useState(AI_COURSE_ESTIMATED_WAIT_SECONDS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goBack = () => {
    const hasPreferenceDraft = readAiCoursePreferenceDraft() != null;
    void navigate({ to: hasPreferenceDraft ? "/recommendation" : "/preference" });
  };

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (preview) return;
    saveAiCoursePendingJobId(jobId);
  }, [jobId, preview]);

  useEffect(() => {
    if (errorMessage || preview) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [errorMessage, preview]);

  useEffect(() => {
    if (preview) return undefined;

    const cachedCourseId = readAiCourseJobCourseId(jobId);
    if (cachedCourseId) {
      void navigateRef.current({
        to: "/ai-search-result",
        search: { courseId: cachedCourseId },
      });
      return undefined;
    }

    let cancelled = false;

    void resumeAiCourseGeneration(jobId)
      .then((courseId) => {
        if (cancelled) return;
        void navigateRef.current({ to: "/ai-search-result", search: { courseId } });
      })
      .catch((error) => {
        if (cancelled) return;

        const recoveredCourseId = resolveAiCourseJobCourseId(jobId, error);
        if (recoveredCourseId) {
          void navigateRef.current({
            to: "/ai-search-result",
            search: { courseId: recoveredCourseId },
          });
          return;
        }

        logAiCourseGenerationFailure(jobId, error);
        if (isPreferenceNotFoundError(error)) {
          clearAiCourseJobContext();
          window.alert("선호도 정보가 필요합니다. 빵 취향을 선택해 주세요.");
          void navigateRef.current({ to: "/preference" });
          return;
        }
        if (!isAiJobNotFoundError(error) && !readAiCourseBtiReturnJobId()) {
          clearAiCourseJobContext();
        }
        setErrorMessage(getErrorMessage(error));
      });

    return () => {
      cancelled = true;
    };
  }, [jobId, preview]);

  const handleRetry = () => {
    goBack();
  };

  if (errorMessage) {
    return (
      <MobileFrame className="flex min-h-screen flex-col bg-white">
        <PreferenceTopBar
          title="AI 코스 추천"
          onBack={goBack}
          onCancel={() => navigate({ to: "/home" })}
        />
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
              onClick={handleRetry}
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
      <PreferenceTopBar
        title="AI 코스 추천"
        onBack={goBack}
        onCancel={() => navigate({ to: "/home" })}
      />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-24">
        {preview ? (
          <p className="rounded-r2 bg-amber-50 px-x3 py-x2 text-center font-pretendard text-size-3 text-amber-800">
            dev 미리보기 — 실제 생성은 진행되지 않습니다
          </p>
        ) : null}

        <p className="text-center font-pretendard text-lg font-semibold text-gray-1000">
          AI 코스를 생성하고 있어요
        </p>

        <div
          className="size-14 shrink-0 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800"
          role="status"
          aria-label="AI 코스 생성 중"
        />

        <p className="max-w-[280px] text-center font-pretendard text-size-4 leading-t5 text-gray-700">
          {preview || secondsLeft > 0 ? (
            <>
              예상 대기 시간
              <br />약{" "}
              <span className="font-semibold text-gray-900">
                {preview ? AI_COURSE_ESTIMATED_WAIT_SECONDS : secondsLeft}초
              </span>{" "}
              남음
            </>
          ) : (
            <>거의 완료되었어요. 조금만 더 기다려 주세요.</>
          )}
        </p>

        <BreadBtiLoadingPrompt jobId={jobId} />
      </main>
    </MobileFrame>
  );
}
