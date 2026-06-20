import { clearAiCourseBtiReturnJobId, clearAiCoursePendingJobId } from "@/utils/aiCourseStorage";
import {
  AI_COURSE_PREFERENCE_STORAGE_KEY,
  AI_COURSE_RESULT_STORAGE_KEY,
} from "@/utils/aiCourseStorage";
import { clearAiCourseDepartureCoords } from "@/lib/aiCourseDepartureCoords";

const AI_COURSE_JOB_COURSE_ID_PREFIX = "aiCourseJobCourse:";

function clearAllAiCourseJobCourseIds(): void {
  if (typeof sessionStorage === "undefined") return;
  const keysToRemove: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(AI_COURSE_JOB_COURSE_ID_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    sessionStorage.removeItem(key);
  }
}

export function clearAiCourseJobContext(): void {
  clearAiCoursePendingJobId();
  clearAiCourseBtiReturnJobId();
}

/** AI 추천 다시받기 — 이전 결과·잡 캐시를 모두 초기화 */
export function resetAiCourseFlowForRetry(): void {
  clearAiCourseJobContext();
  try {
    sessionStorage.removeItem(AI_COURSE_RESULT_STORAGE_KEY);
    sessionStorage.removeItem(AI_COURSE_PREFERENCE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearAllAiCourseJobCourseIds();
  clearAiCourseDepartureCoords();
}
