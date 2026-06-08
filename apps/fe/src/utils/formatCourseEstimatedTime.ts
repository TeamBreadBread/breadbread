/** API/AI 코스 소요시간 문자열에서 불필요한 수식어를 제거해 표시 공간을 확보한다. */
export function formatCourseEstimatedTime(value: string | null | undefined): string {
  if (!value?.trim()) return "";

  return value
    .replace(/총\s*소요\s*/gi, "")
    .replace(/\(\s*이동\s*[,·]?\s*대기\s*포함\s*\)/gi, "")
    .replace(/\(\s*이동\s*대기\s*포함\s*\)/gi, "")
    .trim();
}
