import { isBreadBtiFromAiGenerating, isBreadBtiFromBbangteo } from "@/lib/breadbti/entryFrom";
import { readAiCourseBtiReturnJobId } from "@/utils/aiCourseStorage";

/** BreadBTI 내부 이동 시 `from`·`jobId` 쿼리를 유지 */
export function buildBreadBtiFlowSearch(): Record<string, string> {
  const from = isBreadBtiFromAiGenerating()
    ? ("ai-generating" as const)
    : isBreadBtiFromBbangteo()
      ? ("bbangteo" as const)
      : undefined;
  const jobId = from === "ai-generating" ? readAiCourseBtiReturnJobId() : null;

  const search: Record<string, string> = {};
  if (from) {
    search.from = from;
  }
  if (jobId) {
    search.jobId = jobId;
  }
  return search;
}

export function breadBtiFlowNavigateOptions(to: string) {
  return { to, search: buildBreadBtiFlowSearch() };
}
