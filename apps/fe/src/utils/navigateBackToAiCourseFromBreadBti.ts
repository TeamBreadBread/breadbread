import { getAiCourseStatus } from "@/api/courses";
import {
  readAiCourseBtiReturnJobId,
  readAiCourseJobCourseId,
  readAiCoursePendingJobId,
  resolveAiCourseActiveJobId,
  saveAiCoursePendingJobId,
} from "@/utils/aiCourseStorage";
import {
  ensureAiCourseJobRunning,
  isAiJobNotFoundError,
  resolveAiCourseJobCourseId,
} from "@/utils/aiCourseJobRunner";

type NavigateFn = (options: {
  to: string;
  search?: Record<string, unknown>;
}) => void | Promise<void>;

export function resolveAiCourseReturnJobId(preferredJobId?: string | null): string | null {
  return resolveAiCourseActiveJobId(preferredJobId);
}

/** BreadBTI → AI 생성/결과 화면 복귀 (job 완료·삭제 여부에 따라 분기) */
export async function navigateBackToAiCourseFromBreadBti(
  navigate: NavigateFn,
  preferredJobId?: string | null,
): Promise<void> {
  const jobId = resolveAiCourseReturnJobId(preferredJobId);
  if (!jobId) {
    await navigate({ to: "/home" });
    return;
  }

  saveAiCoursePendingJobId(jobId);

  const cachedCourseId = readAiCourseJobCourseId(jobId);
  if (cachedCourseId) {
    await navigate({ to: "/ai-search-result", search: { courseId: cachedCourseId } });
    return;
  }

  try {
    const { status } = await getAiCourseStatus(jobId);

    if (status === "FAILED") {
      await navigate({ to: "/ai-course-generating", search: { jobId } });
      return;
    }

    if (status === "COMPLETED") {
      const courseId = await ensureAiCourseJobRunning(jobId);
      await navigate({ to: "/ai-search-result", search: { courseId } });
      return;
    }

    await navigate({ to: "/ai-course-generating", search: { jobId } });
  } catch (error) {
    const recoveredCourseId = resolveAiCourseJobCourseId(jobId, error);
    if (recoveredCourseId) {
      await navigate({ to: "/ai-search-result", search: { courseId: recoveredCourseId } });
      return;
    }

    if (isAiJobNotFoundError(error)) {
      await navigate({ to: "/ai-course-generating", search: { jobId } });
      return;
    }

    await navigate({ to: "/ai-course-generating", search: { jobId } });
  }
}

/** 생성 화면 재진입·브라우저 뒤로가기 시 job 상태를 확인한 뒤 이어서 진행 */
export async function resumeAiCourseGeneration(jobId: string): Promise<number> {
  const trimmedJobId = jobId.trim();
  if (!trimmedJobId || trimmedJobId === "preview") {
    throw new Error("jobId가 없습니다.");
  }

  const cachedCourseId = readAiCourseJobCourseId(trimmedJobId);
  if (cachedCourseId) return cachedCourseId;

  saveAiCoursePendingJobId(trimmedJobId);

  try {
    const { status, errorMessage } = await getAiCourseStatus(trimmedJobId);

    if (status === "FAILED") {
      throw new Error(errorMessage ?? "AI 코스 생성 실패");
    }

    if (status === "PENDING" || status === "COMPLETED") {
      return await ensureAiCourseJobRunning(trimmedJobId);
    }

    throw new Error("AI 코스 생성 상태를 확인할 수 없습니다.");
  } catch (error) {
    const recoveredCourseId = resolveAiCourseJobCourseId(trimmedJobId, error);
    if (recoveredCourseId) return recoveredCourseId;
    throw error;
  }
}

export function hasAiCourseReturnContext(): boolean {
  return Boolean(readAiCoursePendingJobId() ?? readAiCourseBtiReturnJobId());
}
