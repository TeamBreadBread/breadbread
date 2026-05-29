import { getAiCourseStatus } from "@/api/courses";

/** 로딩 화면에 보여줄 사용자용 예상 대기 시간 */
export const AI_COURSE_ESTIMATED_WAIT_SECONDS = 30;
/**
 * 실제 폴링 타임아웃.
 * BE webhook 타임아웃(90초)보다 길게 잡아, 생성이 길어져도 프런트가 먼저 끊기지 않도록 한다.
 * 1.5초 간격 × 80회 = 약 120초.
 */
export const AI_COURSE_POLL_MAX_ATTEMPTS = 80;
export const AI_COURSE_POLL_INTERVAL_MS = 1_500;
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
