export const AI_COURSE_PREFERENCE_STORAGE_KEY = "aiCoursePreference";
export const AI_COURSE_RESULT_STORAGE_KEY = "aiCourseResult";
export const AI_COURSE_PENDING_JOB_ID_KEY = "aiCoursePendingJobId";
export const ROUTE_FOCUS_COURSE_ID_KEY = "routeFocusCourseId";

export function saveRouteFocusCourseId(courseId: number): void {
  if (courseId <= 0) return;
  try {
    sessionStorage.setItem(ROUTE_FOCUS_COURSE_ID_KEY, String(courseId));
  } catch {
    /* ignore */
  }
}

export function readRouteFocusCourseId(): number | null {
  try {
    const raw = sessionStorage.getItem(ROUTE_FOCUS_COURSE_ID_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export type AiCoursePreferenceDraft = {
  companion: string;
  budget: string;
  minimizeRoute: boolean;
};

export function saveAiCoursePreferenceDraft(draft: AiCoursePreferenceDraft): void {
  sessionStorage.setItem(AI_COURSE_PREFERENCE_STORAGE_KEY, JSON.stringify(draft));
}

export function readAiCoursePreferenceDraft(): AiCoursePreferenceDraft | null {
  const raw = sessionStorage.getItem(AI_COURSE_PREFERENCE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AiCoursePreferenceDraft;
  } catch {
    return null;
  }
}

export function saveAiCoursePendingJobId(jobId: string): void {
  const trimmed = jobId.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(AI_COURSE_PENDING_JOB_ID_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function readAiCoursePendingJobId(): string | null {
  try {
    const raw = sessionStorage.getItem(AI_COURSE_PENDING_JOB_ID_KEY)?.trim();
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function clearAiCoursePendingJobId(): void {
  try {
    sessionStorage.removeItem(AI_COURSE_PENDING_JOB_ID_KEY);
  } catch {
    /* ignore */
  }
}
