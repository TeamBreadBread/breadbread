export const AI_COURSE_PREFERENCE_STORAGE_KEY = "aiCoursePreference";
export const AI_COURSE_RESULT_STORAGE_KEY = "aiCourseResult";

export type AiCoursePreferenceDraft = {
  companion: string;
  budget: string;
  minimizeRoute: boolean;
  latitude: number;
  longitude: number;
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
