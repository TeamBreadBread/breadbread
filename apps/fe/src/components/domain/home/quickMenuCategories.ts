import imgBread from "@/assets/icons/Img_Bread.svg";
import imgMap from "@/assets/icons/Img_Map.svg";
import imgPick from "@/assets/icons/Img_Pick.svg";
import imgTheme from "@/assets/icons/Img_Theme.svg";

export type QuickMenuCategoryLabel = "지역별" | "종류별" | "에디터픽" | "테마별";

export type QuickMenuCategory = {
  label: QuickMenuCategoryLabel;
  imageSrc: string;
  to:
    | "/bbangteo-region-courses"
    | "/bbangteo-type-courses"
    | "/bbangteo-editor-pick-courses"
    | "/bbangteo-theme-courses";
};

export const QUICK_MENU_CATEGORIES: readonly QuickMenuCategory[] = [
  { label: "지역별", imageSrc: imgMap, to: "/bbangteo-region-courses" },
  { label: "종류별", imageSrc: imgBread, to: "/bbangteo-type-courses" },
  { label: "에디터픽", imageSrc: imgPick, to: "/bbangteo-editor-pick-courses" },
  { label: "테마별", imageSrc: imgTheme, to: "/bbangteo-theme-courses" },
] as const;

export const QUICK_MENU_ROUTE_BY_LABEL: Record<QuickMenuCategoryLabel, QuickMenuCategory["to"]> =
  Object.fromEntries(QUICK_MENU_CATEGORIES.map((item) => [item.label, item.to])) as Record<
    QuickMenuCategoryLabel,
    QuickMenuCategory["to"]
  >;
