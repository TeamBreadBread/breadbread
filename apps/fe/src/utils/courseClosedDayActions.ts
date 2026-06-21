import {
  excludeBakeryFromCourse,
  getCourseDetail,
  replaceBakeryInCourse,
  type CourseDetail,
} from "@/api/courses";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";

export async function excludeClosedBakeryFromCourse(
  courseId: number,
  bakeryId: number,
): Promise<CourseDetail> {
  await excludeBakeryFromCourse(courseId, bakeryId);
  return getCourseDetail(courseId);
}

export async function replaceClosedBakeryInCourse(
  courseId: number,
  bakeryId: number,
): Promise<{ detail: CourseDetail; replacementName?: string | null }> {
  const result = await replaceBakeryInCourse(courseId, bakeryId);
  const detail = await getCourseDetail(courseId);
  return {
    detail,
    replacementName: result.replacementBakeryName,
  };
}

export function isEmptyCourseError(error: unknown): boolean {
  return (
    error instanceof ApiBusinessError &&
    (error.code === "E0405" || /최소 1개/.test(error.message ?? ""))
  );
}

export function formatCourseMutationError(error: unknown): string {
  if (isEmptyCourseError(error)) {
    return "코스에 남은 빵집이 없어 안내를 시작할 수 없습니다. 다른 코스를 선택해 주세요.";
  }
  return getErrorMessage(error);
}
