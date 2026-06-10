import type { CourseDetail, MyRouteCourse } from "@/api/courses";

function normalizeCourseName(name?: string | null): string {
  return name?.trim() ?? "";
}

function normalizeBakeryNames(names: readonly string[]): string[] {
  return names.map((name) => name.trim()).filter(Boolean);
}

/** 코스 이름 + 방문 빵집 구성(순서 포함)이 동일한지 비교 */
export function isSameCourseRouteContent(
  detail: Pick<CourseDetail, "name" | "bakeries">,
  route: MyRouteCourse,
): boolean {
  if (normalizeCourseName(detail.name) !== normalizeCourseName(route.name)) {
    return false;
  }

  const detailNames = normalizeBakeryNames(detail.bakeries.map((bakery) => bakery.name));
  const routeNames = normalizeBakeryNames(route.bakeryNames);

  if (detailNames.length !== routeNames.length) return false;
  if (detailNames.length !== route.bakeryCount) return false;

  return detailNames.every((name, index) => name === routeNames[index]);
}

export function findMatchingSavedRoute(
  routes: MyRouteCourse[],
  detail: Pick<CourseDetail, "name" | "bakeries">,
): MyRouteCourse | undefined {
  return routes.find((route) => isSameCourseRouteContent(detail, route));
}
