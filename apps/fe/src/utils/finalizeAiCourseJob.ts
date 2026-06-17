import { getCourseDetail, saveAiCourse, saveCourseRoute } from "@/api/courses";
import { pollAiCourseStatus } from "@/utils/pollAiCourseStatus";
import {
  AI_COURSE_RESULT_STORAGE_KEY,
  clearAiCoursePendingJobId,
  saveAiCourseJobCourseId,
} from "@/utils/aiCourseStorage";

/** AI job 완료 대기 → 저장 → sessionStorage 반영 후 courseId 반환 */
export async function finalizeAiCourseJob(jobId: string): Promise<number> {
  await pollAiCourseStatus(jobId);
  const courseId = await saveAiCourse(jobId);
  const [, courseDetail] = await Promise.all([
    saveCourseRoute(courseId).catch(() => undefined),
    getCourseDetail(courseId),
  ]);
  sessionStorage.setItem(AI_COURSE_RESULT_STORAGE_KEY, JSON.stringify(courseDetail));
  saveAiCourseJobCourseId(jobId, courseId);
  clearAiCoursePendingJobId();
  return courseId;
}
