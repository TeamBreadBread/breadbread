import { getAiCourseStatus } from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { hasUserPreferenceSaved } from "@/api/user";
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

export type NavigateToAiCourseEntryOptions = {
  onPreferenceRequired?: () => void;
};

export type NavigateToAiCourseEntryResult = "navigated" | "preference_required" | "error";

async function ensureUserPreferenceForAiEntry(
  onPreferenceRequired?: () => void,
): Promise<NavigateToAiCourseEntryResult> {
  try {
    const hasPreference = await hasUserPreferenceSaved();
    if (!hasPreference) {
      onPreferenceRequired?.();
      return "preference_required";
    }
    return "navigated";
  } catch (error) {
    window.alert(getErrorMessage(error));
    return "error";
  }
}

/**
 * 홈 등에서 AI 추천 진입 시, BreadBTI 체험 중 떠난 생성 job이 있으면
 * 진행 중이면 로딩 화면, 완료됐으면 결과 화면으로 보낸다.
 */
export async function navigateToAiCourseEntry(
  navigate: NavigateFn,
  options?: NavigateToAiCourseEntryOptions,
): Promise<NavigateToAiCourseEntryResult> {
  const pendingJobId = readAiCoursePendingJobId();
  if (!pendingJobId) {
    const preflight = await ensureUserPreferenceForAiEntry(options?.onPreferenceRequired);
    if (preflight !== "navigated") {
      return preflight;
    }
    await navigate({ to: AI_COURSE_FLOW_START });
    return "navigated";
  }

  const cachedCourseId = readAiCourseJobCourseId(pendingJobId);
  if (cachedCourseId) {
    await navigate({ to: "/ai-search-result", search: { courseId: cachedCourseId } });
    return "navigated";
  }

  try {
    const { status, errorMessage } = await getAiCourseStatus(pendingJobId);

    if (status === "FAILED") {
      clearAiCourseJobContext();
      if (isPreferenceNotFoundError(errorMessage ?? "")) {
        options?.onPreferenceRequired?.();
        return "preference_required";
      }
      window.alert(errorMessage ?? "AI 코스 생성에 실패했어요. 다시 시도해 주세요.");
      await navigate({ to: AI_COURSE_FLOW_START });
      return "navigated";
    }

    if (status === "PENDING") {
      await navigate({ to: "/ai-course-generating", search: { jobId: pendingJobId } });
      return "navigated";
    }

    const courseId = await ensureAiCourseJobRunning(pendingJobId);
    await navigate({ to: "/ai-search-result", search: { courseId } });
    return "navigated";
  } catch (error) {
    const recoveredCourseId = resolveAiCourseJobCourseId(pendingJobId, error);
    if (recoveredCourseId) {
      await navigate({ to: "/ai-search-result", search: { courseId: recoveredCourseId } });
      return "navigated";
    }

    if (isAiJobNotFoundError(error)) {
      clearAiCourseJobContext();
    }

    window.alert(getErrorMessage(error));
    await navigate({ to: AI_COURSE_FLOW_START });
    return "error";
  }
}
