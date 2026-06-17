import { clearAiCourseBtiReturnJobId, clearAiCoursePendingJobId } from "@/utils/aiCourseStorage";

export function clearAiCourseJobContext(): void {
  clearAiCoursePendingJobId();
  clearAiCourseBtiReturnJobId();
}
