import { getCourseDetail } from "@/api/courses";
import { getBakeryById } from "@/api/bakery";
import { isBakeryClosedToday } from "@/utils/bakeryBusinessHours";

export type ClosedCourseBakery = {
  bakeryId: number;
  name: string;
};

export async function findClosedBakeriesInCourse(courseId: number): Promise<ClosedCourseBakery[]> {
  const course = await getCourseDetail(courseId);
  const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
  if (bakeryIds.length === 0) return [];

  const details = await Promise.all(
    bakeryIds.map(async (bakeryId) => {
      try {
        const detail = await getBakeryById(bakeryId);
        const courseBakery = course.bakeries.find((item) => item.id === bakeryId);
        return {
          bakeryId,
          name: detail.name?.trim() || courseBakery?.name?.trim() || "빵집",
          closedDays: detail.closedDays,
        };
      } catch {
        return null;
      }
    }),
  );

  return details
    .filter((item): item is NonNullable<typeof item> => item != null)
    .filter((item) => isBakeryClosedToday(item.closedDays))
    .map(({ bakeryId, name }) => ({ bakeryId, name }));
}
