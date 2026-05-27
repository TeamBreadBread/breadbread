export type CourseOrderMarkerPalette = {
  background: string;
  border: string;
  text: string;
};

/** AI 코스 빵집 순번별 핀·타임라인 번호 색 (1~5) */
export const COURSE_ORDER_MARKER_PALETTES: readonly CourseOrderMarkerPalette[] = [
  { background: "#d36e05", border: "#ffeadc", text: "#ffffff" }, // orange_600
  { background: "#019c48", border: "#edfaf6", text: "#ffffff" }, // green_600
  { background: "#e42e47", border: "#fdf0f0", text: "#ffffff" }, // red_600
  { background: "#006bcc", border: "#eff6ff", text: "#ffffff" }, // blue_600
  { background: "#B581FF", border: "#F0E6FF", text: "#ffffff" },
] as const;

const FALLBACK_PALETTE: CourseOrderMarkerPalette = {
  background: "#868b94",
  border: "#eeeff1",
  text: "#ffffff",
};

export function getCourseOrderMarkerPalette(order: number): CourseOrderMarkerPalette {
  const index = order - 1;
  if (index >= 0 && index < COURSE_ORDER_MARKER_PALETTES.length) {
    return COURSE_ORDER_MARKER_PALETTES[index];
  }
  return FALLBACK_PALETTE;
}

/** 타임라인 번호 뱃지 배경 (Tailwind) */
export const COURSE_ORDER_BADGE_BG_CLASS: Record<number, string> = {
  1: "bg-orange-600",
  2: "bg-green-600",
  3: "bg-red-600",
  4: "bg-blue-600",
  5: "bg-[#B581FF]",
};

export function getCourseOrderBadgeBgClass(order: number): string {
  return COURSE_ORDER_BADGE_BG_CLASS[order] ?? "bg-gray-700";
}
