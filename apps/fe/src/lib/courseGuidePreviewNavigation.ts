import type { CourseTransportMode } from "@/lib/courseTransportMode";

export type CourseGuidePreviewReturnFrom = "ai-result" | "route" | "chatbot" | "home";

export type CourseGuidePreviewSearch = {
  courseId: number;
  transportMode: CourseTransportMode;
  returnFrom?: CourseGuidePreviewReturnFrom;
};

function parseCourseId(value: unknown): number | null {
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

function parseTransportMode(value: unknown): CourseTransportMode | null {
  if (value === "WALKING" || value === "BIKE" || value === "CAR") return value;
  return null;
}

function parseReturnFrom(value: unknown): CourseGuidePreviewReturnFrom | undefined {
  if (value === "ai-result" || value === "route" || value === "chatbot" || value === "home") {
    return value;
  }
  return undefined;
}

export function parseCourseGuidePreviewSearch(
  search: Record<string, unknown>,
): CourseGuidePreviewSearch | null {
  const courseId = parseCourseId(search.courseId);
  const transportMode = parseTransportMode(search.transportMode);
  if (courseId == null || transportMode == null) return null;

  return {
    courseId,
    transportMode,
    returnFrom: parseReturnFrom(search.returnFrom),
  };
}

export function buildCourseGuidePreviewSearch(params: CourseGuidePreviewSearch) {
  return {
    courseId: params.courseId,
    transportMode: params.transportMode,
    ...(params.returnFrom ? { returnFrom: params.returnFrom } : {}),
  };
}
