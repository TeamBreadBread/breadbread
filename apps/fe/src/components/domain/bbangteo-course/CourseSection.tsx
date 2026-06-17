import { useNavigate } from "@tanstack/react-router";
import type { CourseSummaryItem } from "@/api/courses";
import CurationFooter, { type CurationItem } from "@/components/domain/home/CurationFooter";
import { buildBbakeryDetailSearch } from "@/utils/bakeryListEntry";

type CourseSectionProps = {
  course: CourseSummaryItem;
};

const CourseSection = ({ course }: CourseSectionProps) => {
  const navigate = useNavigate();

  const items = (course.bakeries ?? []).map((bakery) => ({
    bakeryId: bakery.id,
    title: bakery.name,
    address: bakery.region,
    rate: bakery.rating,
    imageUrl: bakery.thumbnailUrl,
  }));

  const openCourse = () => {
    void navigate({
      to: "/ai-search-result",
      search: { courseId: course.id, from: undefined },
    });
  };

  const handleBakeryClick = (item: CurationItem) => {
    if (item.bakeryId == null) return;
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: buildBbakeryDetailSearch({
        bakeryId: item.bakeryId,
        from: "ai-result",
        courseId: course.id,
      }),
    });
  };

  return (
    <section className="w-full shrink-0 bg-white px-[20px] py-[18px]">
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-start justify-between gap-[12px]">
          <button type="button" onClick={openCourse} className="min-w-0 flex-1 text-left">
            <h2 className="font-pretendard typo-t6bold text-gray-1000">{course.name}</h2>
            <p className="mt-[4px] font-pretendard text-[13px] leading-[18px] text-[#868b94]">
              {course.bakeryCount}곳 · {course.estimatedTime}
              {course.estimatedCost > 0
                ? ` · ${course.estimatedCost.toLocaleString("ko-KR")}원`
                : ""}
            </p>
          </button>
          <button
            type="button"
            onClick={openCourse}
            className="shrink-0 text-[14px] leading-[19px] font-medium text-[#868b94]"
          >
            더보기
          </button>
        </div>

        <div className="w-full min-h-0">
          <CurationFooter
            items={items}
            itemClassName="!w-[160px]"
            cardImageClassName="!w-[160px] !h-[152px]"
            breadIconClassName="!w-[40px] !h-[39px]"
            onItemClick={handleBakeryClick}
          />
        </div>
      </div>
    </section>
  );
};

export default CourseSection;
