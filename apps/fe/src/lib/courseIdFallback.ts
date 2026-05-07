function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.floor(value);
    return parsed > 0 ? parsed : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/** AI 연동 전 임시 예약 플로우용 fallback 코스 ID. */
export function getDevFallbackCourseId(): number | null {
  return parsePositiveInt(import.meta.env.VITE_DEV_FALLBACK_COURSE_ID);
}
