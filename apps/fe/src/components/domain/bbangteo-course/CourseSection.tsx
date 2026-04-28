import type { CourseItem } from "./types";
import CurationFooter from "@/components/domain/home/CurationFooter";

type CourseSectionProps = {
  course: CourseItem;
};

const CourseSection = ({ course }: CourseSectionProps) => {
  return (
    <section className="h-[276px] w-full shrink-0 bg-white px-[20px] py-[18px]">
      <div className="flex h-full flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[4px]">
            <div className="flex items-center p-[3px]">
              <div className="h-[18px] w-[18px] rounded-full bg-[#dcdee3]" />
            </div>
            <h2 className="font-pretendard typo-t6bold text-gray-1000">{course.name}</h2>
          </div>
          <button type="button" className="text-[14px] leading-[19px] font-medium text-[#868b94]">
            더보기
          </button>
        </div>

        <div className="w-full min-h-0 flex-1">
          <CurationFooter
            itemClassName="!w-[160px]"
            cardImageClassName="!w-[160px] !h-[152px]"
            breadIconClassName="!w-[40px] !h-[39px]"
          />
        </div>
      </div>
    </section>
  );
};

export default CourseSection;
