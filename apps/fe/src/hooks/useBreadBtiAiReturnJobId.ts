import { getRouteApi } from "@tanstack/react-router";

import { resolveAiCourseReturnJobId } from "@/utils/navigateBackToAiCourseFromBreadBti";

const breadbtiRouteApi = getRouteApi("/breadbti");

export function useBreadBtiAiReturnJobId(): string | null {
  const { jobId } = breadbtiRouteApi.useSearch();
  return resolveAiCourseReturnJobId(jobId);
}
