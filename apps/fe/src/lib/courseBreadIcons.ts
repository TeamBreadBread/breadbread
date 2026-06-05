import BreadCategoryImg from "@/assets/icons/Img_Bread.svg";
import CakeCategoryImg from "@/assets/icons/Img_Cake.svg";
import CookieCategoryImg from "@/assets/icons/Img_Cookie.svg";
import DietbreadCategoryImg from "@/assets/icons/Img_Dietbread.svg";
import RicecakeCategoryImg from "@/assets/icons/Img_Ricecake.svg";
import SandwichCategoryImg from "@/assets/icons/Img_Sandwich.svg";

/** AIPreferencePage와 동일한 빵 카테고리 일러스트 */
export const COURSE_BREAD_ICONS = [
  BreadCategoryImg,
  SandwichCategoryImg,
  CakeCategoryImg,
  RicecakeCategoryImg,
  CookieCategoryImg,
  DietbreadCategoryImg,
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 코스 ID 등 시드 기준으로 항상 같은 아이콘을 고른다. */
export function pickCourseBreadIcon(seed: string | number): string {
  const index = hashSeed(String(seed)) % COURSE_BREAD_ICONS.length;
  return COURSE_BREAD_ICONS[index]!;
}

/** 코스 내 각 정거장마다 서로 다른 아이콘 (재렌더 시에도 동일). */
export function pickCourseBreadIconForStop(
  courseSeed: string | number,
  stopKey: string | number,
): string {
  return pickCourseBreadIcon(`${courseSeed}:${stopKey}`);
}
