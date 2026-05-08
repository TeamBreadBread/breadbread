import { getAiCourseStatus } from "@/api/courses";

/** 폴링·로딩 화면 예상 시간과 동일하게 유지 */
export const AI_COURSE_POLL_MAX_ATTEMPTS = 30;
export const AI_COURSE_POLL_INTERVAL_MS = 2_000;
export const AI_COURSE_MAX_WAIT_SECONDS = Math.ceil(
  (AI_COURSE_POLL_MAX_ATTEMPTS * AI_COURSE_POLL_INTERVAL_MS) / 1000,
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function pollAiCourseStatus(jobId: string): Promise<number> {
  const maxTryCount = AI_COURSE_POLL_MAX_ATTEMPTS;
  const intervalMs = AI_COURSE_POLL_INTERVAL_MS;

  for (let i = 0; i < maxTryCount; i += 1) {
    const statusResult = await getAiCourseStatus(jobId);

    if (statusResult.status === "COMPLETED") {
      if (!statusResult.courseId) {
        throw new Error("courseId가 없습니다.");
      }
      return statusResult.courseId;
    }

    if (statusResult.status === "FAILED") {
      throw new Error(statusResult.errorMessage ?? "AI 코스 생성 실패");
    }

    await sleep(intervalMs);
  }

  throw new Error("AI 코스 생성 시간이 초과되었습니다.");
}
