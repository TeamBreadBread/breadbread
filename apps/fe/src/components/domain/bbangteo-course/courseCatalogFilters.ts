import type { BreadType } from "@/api/courses";

export type CourseCatalogMode = "region" | "type" | "theme" | "editorPick";

export type CourseCatalogFilterOption = {
  label: string;
  value?: string;
};

export const REGION_FILTER_OPTIONS: CourseCatalogFilterOption[] = [
  { label: "전체" },
  { label: "대전 중구", value: "대전 중구" },
  { label: "대전 서구", value: "대전 서구" },
  { label: "대전 유성구", value: "대전 유성구" },
  { label: "대전 동구", value: "대전 동구" },
  { label: "대전 대덕구", value: "대전 대덕구" },
];

export const BREAD_TYPE_FILTER_OPTIONS: CourseCatalogFilterOption[] = [
  { label: "전체" },
  { label: "빵", value: "BREAD" },
  { label: "샌드위치", value: "SANDWICH" },
  { label: "케이크", value: "CAKE" },
  { label: "떡", value: "RICE_CAKE" },
  { label: "쿠키", value: "COOKIE" },
  { label: "다이어트", value: "DIET" },
];

export const THEME_FILTER_OPTIONS: CourseCatalogFilterOption[] = [
  { label: "전체" },
  { label: "데이트", value: "데이트" },
  { label: "가족", value: "가족" },
  { label: "친구", value: "친구" },
  { label: "혼자", value: "혼자" },
];

export function getFilterOptionsForMode(mode: CourseCatalogMode): CourseCatalogFilterOption[] {
  switch (mode) {
    case "region":
      return REGION_FILTER_OPTIONS;
    case "type":
      return BREAD_TYPE_FILTER_OPTIONS;
    case "theme":
      return THEME_FILTER_OPTIONS;
    default:
      return [];
  }
}

export function buildCourseCatalogParams(
  mode: CourseCatalogMode,
  filterValue?: string,
): {
  region?: string;
  breadType?: BreadType;
  theme?: string;
  editorPick?: boolean;
  page: number;
  size: number;
} {
  const params = { page: 0, size: 20 };

  if (mode === "editorPick") {
    return { ...params, editorPick: true };
  }
  if (mode === "region" && filterValue) {
    return { ...params, region: filterValue };
  }
  if (mode === "type" && filterValue) {
    return { ...params, breadType: filterValue as BreadType };
  }
  // 테마(동행 유형)는 서버 theme 미설정 코스가 있어 목록 조회 후 클라이언트에서 분류합니다.

  return params;
}
