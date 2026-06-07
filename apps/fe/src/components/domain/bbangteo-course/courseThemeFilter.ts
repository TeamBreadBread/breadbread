import type { CourseSummaryItem } from "@/api/courses";

export type CompanionTheme = "데이트" | "가족" | "친구" | "혼자";

const COMPANION_THEMES: CompanionTheme[] = ["데이트", "가족", "친구", "혼자"];

const THEME_ALIASES: Record<string, CompanionTheme> = {
  데이트: "데이트",
  커플: "데이트",
  COUPLE: "데이트",
  가족: "가족",
  FAMILY: "가족",
  친구: "친구",
  FRIENDS: "친구",
  혼자: "혼자",
  ALONE: "혼자",
};

/** 코스명 기반 동행 테마 추론 (서버 theme 미설정 코스용) */
const NAME_THEME_RULES: { theme: CompanionTheme; keywords: string[] }[] = [
  { theme: "혼자", keywords: ["숨은 카페", "디저트 로드", "디저트 삼중주", "퓨전"] },
  { theme: "데이트", keywords: ["카페·", "카페거리", "케이크 거리"] },
  { theme: "가족", keywords: ["성심당", "온천", "구움과자"] },
  { theme: "친구", keywords: ["트렌디", "로컬", "둔산"] },
];

export function normalizeCompanionTheme(value?: string | null): CompanionTheme | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return (
    THEME_ALIASES[trimmed] ??
    (COMPANION_THEMES.includes(trimmed as CompanionTheme) ? (trimmed as CompanionTheme) : undefined)
  );
}

export function resolveCourseCompanionTheme(course: CourseSummaryItem): CompanionTheme | undefined {
  const fromApi = normalizeCompanionTheme(course.theme);
  if (fromApi) return fromApi;

  const name = course.name ?? "";
  for (const rule of NAME_THEME_RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) {
      return rule.theme;
    }
  }

  return undefined;
}

export function filterCoursesByCompanionTheme(
  courses: CourseSummaryItem[],
  theme: string,
): CourseSummaryItem[] {
  const normalized = normalizeCompanionTheme(theme);
  if (!normalized) return courses;

  return courses.filter((course) => resolveCourseCompanionTheme(course) === normalized);
}
