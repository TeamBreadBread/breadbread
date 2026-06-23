import type { BakeryTagType, BreadTagType } from "@/api/types/bakery";

export const bakeryTagLabelMap: Record<BakeryTagType, string> = {
  COZY: "아늑해요",
  QUIET: "조용해요",
  LIVELY: "활기차요",
  EMOTIONAL: "감성적이에요",
  LOCAL_VIBE: "로컬감성",
  SWEET: "달콤해요",
  SAVORY: "짭짤해요",
  CRISPY: "바삭해요",
  SOFT: "부드러워요",
  NUTTY: "고소해요",
};

export const breadTagLabelMap: Record<BreadTagType, string> = {
  SWEET: "달콤해요",
  SAVORY: "짭짤해요",
  CRISPY: "바삭해요",
  SOFT: "부드러워요",
  NUTTY: "고소해요",
  SPICY: "매콤해요",
  CHEWY: "쫄깃해요",
  RICH: "진해요",
};

export const MAX_BAKERY_DETAIL_TAGS = 5;
export const MAX_BREAD_DETAIL_TAGS = 2;

export const MAX_BAKERY_TAG_SELECT = 2;
export const MAX_REVIEW_MENU_SELECT = 5;
export const MAX_BREAD_TAG_SELECT = 2;

export const ALL_BAKERY_TAG_OPTIONS: BakeryTagType[] = [
  "COZY",
  "QUIET",
  "LIVELY",
  "EMOTIONAL",
  "LOCAL_VIBE",
  "SWEET",
  "SAVORY",
  "CRISPY",
  "SOFT",
  "NUTTY",
];

export const ALL_BREAD_TAG_OPTIONS: BreadTagType[] = [
  "SWEET",
  "SAVORY",
  "CRISPY",
  "SOFT",
  "NUTTY",
  "SPICY",
  "CHEWY",
  "RICH",
];

export function formatBakeryTagLabel(tag: BakeryTagType | string): string {
  return bakeryTagLabelMap[tag as BakeryTagType] ?? tag;
}

export function formatBreadTagLabel(tag: BreadTagType | string): string {
  return breadTagLabelMap[tag as BreadTagType] ?? tag;
}

/** API 응답이 null/undefined여도 빈 배열로 정규화 */
export function normalizeBakeryTags(tags?: BakeryTagType[] | null): BakeryTagType[] {
  return tags ?? [];
}

export function normalizeBreadTags(tags?: BreadTagType[] | null): BreadTagType[] {
  return tags ?? [];
}
