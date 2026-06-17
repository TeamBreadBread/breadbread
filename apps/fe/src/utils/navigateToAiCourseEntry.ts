import { getAiCourseStatus } from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";
import { isPreferenceNotFoundError } from "@/utils/aiCoursePreference";
import { clearAiCourseJobContext } from "@/utils/clearAiCourseJobContext";
import { readAiCourseJobCourseId, readAiCoursePendingJobId } from "@/utils/aiCourseStorage";
import {
  ensureAiCourseJobRunning,
  isAiJobNotFoundError,
  resolveAiCourseJobCourseId,
} from "@/utils/aiCourseJobRunner";

type NavigateFn = (options: {
  to: string;
  search?: Record<string, unknown>;
}) => void | Promise<void>;

/**
 * 홈 등에서 AI 추천 진입 시, BreadBTI 체험 중 떠난 생성 job이 있으면
 * 진행 중이면 로딩 화면, 완료됐으면 결과 화면으로 보낸다.
 */
export async function navigateToAiCourseEntry(navigate: NavigateFn): Promise<void> {
  const pendingJobId = readAiCoursePendingJobId();
  if (!pendingJobId) {
    await navigate({ to: AI_COURSE_FLOW_START });
    return;
  }

  const cachedCourseId = readAiCourseJobCourseId(pendingJobId);
  if (cachedCourseId) {
    await navigate({ to: "/ai-search-result", search: { courseId: cachedCourseId } });
    return;
  }

  try {
    const { status, errorMessage } = await getAiCourseStatus(pendingJobId);

    if (status === "FAILED") {
      clearAiCourseJobContext();
      if (isPreferenceNotFoundError(errorMessage ?? "")) {
        window.alert("선호도를 먼저 선택해 주세요. 빵 취향 조사부터 진행할게요.");
      } else {
        window.alert(errorMessage ?? "AI 코스 생성에 실패했어요. 다시 시도해 주세요.");
      }
      await navigate({ to: AI_COURSE_FLOW_START });
      return;
    }

    if (status === "PENDING") {
      await navigate({ to: "/ai-course-generating", search: { jobId: pendingJobId } });
      return;
    }

    const courseId = await ensureAiCourseJobRunning(pendingJobId);
    await navigate({ to: "/ai-search-result", search: { courseId } });
  } catch (error) {
    const recoveredCourseId = resolveAiCourseJobCourseId(pendingJobId, error);
    if (recoveredCourseId) {
      await navigate({ to: "/ai-search-result", search: { courseId: recoveredCourseId } });
      return;
    }

    if (isAiJobNotFoundError(error)) {
      clearAiCourseJobContext();
    }

    window.alert(getErrorMessage(error));
    await navigate({ to: AI_COURSE_FLOW_START });
  }
}
