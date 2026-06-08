import { getCourseDetail, reorderCourseBakeries } from "@/api/courses";
import type { CongestionCheckResult } from "@/api/tours";

const HIGH_LEVELS = new Set(["HIGH", "CRITICAL"]);
const LONG_WAIT_MINUTES = 20;

function isBusyCongestion(item: CongestionCheckResult): boolean {
  const level = (item.level ?? "").trim().toUpperCase();
  if (HIGH_LEVELS.has(level)) return true;
  return (item.expectedWaitMin ?? 0) >= LONG_WAIT_MINUTES;
}

/** 혼잡도가 높은 빵집을 코스 순서 뒤쪽으로 이동 */
export async function reorderCourseForCongestion(
  courseId: number,
  congestionResults?: CongestionCheckResult[],
): Promise<{ movedBakeryName: string | null }> {
  const course = await getCourseDetail(courseId);
  const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);

  if (bakeryIds.length < 2) {
    throw new Error("코스에 변경할 빵집이 충분하지 않습니다.");
  }

  const busyItems = (congestionResults ?? [])
    .filter(isBusyCongestion)
    .sort((a, b) => (b.congestionScore ?? 0) - (a.congestionScore ?? 0));

  const targetBakeryId = busyItems[0]?.bakeryId ?? bakeryIds[0];
  const newOrder = [...bakeryIds.filter((id) => id !== targetBakeryId), targetBakeryId];

  await reorderCourseBakeries(courseId, { bakeryOrder: newOrder });

  const movedBakery =
    course.bakeries.find((bakery) => bakery.id === targetBakeryId)?.name ??
    busyItems[0]?.bakeryName ??
    null;

  return { movedBakeryName: movedBakery };
}

/** 혼잡 빵집과 대체 빵집의 방문 순서를 맞바꿉니다. */
export async function swapBakeryInCourse(
  courseId: number,
  congestedBakeryId: number,
  alternativeBakeryId: number,
): Promise<{ fromName: string; toName: string }> {
  const course = await getCourseDetail(courseId);
  const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);

  const congestedIndex = bakeryIds.indexOf(congestedBakeryId);
  const alternativeIndex = bakeryIds.indexOf(alternativeBakeryId);

  if (congestedIndex < 0 || alternativeIndex < 0) {
    throw new Error("코스에서 변경할 빵집을 찾을 수 없습니다.");
  }

  const newOrder = [...bakeryIds];
  [newOrder[congestedIndex], newOrder[alternativeIndex]] = [
    newOrder[alternativeIndex],
    newOrder[congestedIndex],
  ];

  await reorderCourseBakeries(courseId, { bakeryOrder: newOrder });

  const fromName =
    course.bakeries.find((bakery) => bakery.id === congestedBakeryId)?.name?.trim() ?? "기존 빵집";
  const toName =
    course.bakeries.find((bakery) => bakery.id === alternativeBakeryId)?.name?.trim() ??
    "추천 빵집";

  return { fromName, toName };
}

/**
 * TODO(BE): 혼잡 빵집을 대체 빵집으로 교체하는 API가 필요합니다.
 * - POST /courses/{courseId}/bakeries/replace
 * - body: { targetBakeryId: number, replacementBakeryId?: number }
 * - replacementBakeryId 생략 시 AI/추천 엔진이 대체 빵집을 제안
 */
