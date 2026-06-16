import { ApiBusinessError } from "@/api/types/common";
import { readAiCourseJobCourseId, saveAiCourseJobCourseId } from "@/utils/aiCourseStorage";
import { finalizeAiCourseJob } from "@/utils/finalizeAiCourseJob";

type AiCourseJobEntry = {
  promise: Promise<number>;
};

const aiCourseJobs = new Map<string, AiCourseJobEntry>();

export function isAiJobNotFoundError(error: unknown): boolean {
  return error instanceof ApiBusinessError && error.code === "E0411";
}

/** BreadBTI 등 다른 화면으로 이동해도 동일 jobId에 대해 finalize는 한 번만 실행한다. */
export function ensureAiCourseJobRunning(jobId: string): Promise<number> {
  const trimmedJobId = jobId.trim();
  if (!trimmedJobId) {
    return Promise.reject(new Error("jobId가 없습니다."));
  }

  const cachedCourseId = readAiCourseJobCourseId(trimmedJobId);
  if (cachedCourseId) {
    return Promise.resolve(cachedCourseId);
  }

  const existing = aiCourseJobs.get(trimmedJobId);
  if (existing) {
    return existing.promise;
  }

  const promise = finalizeAiCourseJob(trimmedJobId)
    .then((courseId) => {
      saveAiCourseJobCourseId(trimmedJobId, courseId);
      return courseId;
    })
    .finally(() => {
      aiCourseJobs.delete(trimmedJobId);
    });

  aiCourseJobs.set(trimmedJobId, { promise });
  return promise;
}

export function resolveAiCourseJobCourseId(jobId: string, error?: unknown): number | null {
  const cachedCourseId = readAiCourseJobCourseId(jobId);
  if (cachedCourseId) return cachedCourseId;
  if (error && !isAiJobNotFoundError(error)) return null;
  return null;
}
