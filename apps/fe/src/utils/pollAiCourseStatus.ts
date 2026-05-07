import { getAiCourseStatus } from "@/api/courses";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function pollAiCourseStatus(jobId: string): Promise<number> {
  const maxTryCount = 30;
  const intervalMs = 2_000;

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
