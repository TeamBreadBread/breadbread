import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { getCourseDetail, saveCourseRoute } from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { AI_COURSE_MAX_WAIT_SECONDS, pollAiCourseStatus } from "@/utils/pollAiCourseStatus";
import { AI_COURSE_RESULT_STORAGE_KEY } from "@/utils/aiCourseStorage";

type AiCourseGeneratingPageProps = {
  jobId: string;
};

export default function AiCourseGeneratingPage({ jobId }: AiCourseGeneratingPageProps) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(AI_COURSE_MAX_WAIT_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const courseId = await pollAiCourseStatus(jobId);
        if (cancelled) return;
        try {
          await saveCourseRoute(courseId);
        } catch {
          // 이미 저장된 코스거나 일시 오류여도 결과 화면 이동은 계속 진행
        }
        if (cancelled) return;
        const courseDetail = await getCourseDetail(courseId);
        if (cancelled) return;
        sessionStorage.setItem(AI_COURSE_RESULT_STORAGE_KEY, JSON.stringify(courseDetail));
        navigate({ to: "/ai-search-result", search: { courseId } });
      } catch (e) {
        if (!cancelled) {
          window.alert(getErrorMessage(e));
          navigate({ to: "/recommendation" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, navigate]);

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
      </main>
    </MobileFrame>
  );
}
