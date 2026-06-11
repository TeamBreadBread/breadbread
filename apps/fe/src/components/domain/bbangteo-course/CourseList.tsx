import type { CourseSummaryItem } from "@/api/courses";
import SadBreadImage from "@/assets/images/Sad_Bread.svg";
import CourseSection from "./CourseSection";

type CourseListProps = {
  courses: CourseSummaryItem[];
  loading: boolean;
};

const CourseList = ({ courses, loading }: CourseListProps) => {
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center pb-[56px] sm:pb-[60px]">
        <p className="text-[14px] text-[#868b94]">코스 불러오는 중…</p>
      </main>
    );
  }

  if (courses.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-[12px] px-[20px] pb-[56px] sm:pb-[60px]">
        <img src={SadBreadImage} alt="" aria-hidden className="h-[96px] w-[96px] object-contain" />
        <p className="text-center text-[14px] leading-[20px] text-[#868b94]">아직 준비중입니다</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-[10px] overflow-y-auto pb-[56px] sm:pb-[60px]">
      {courses.map((course) => (
        <CourseSection key={course.id} course={course} />
      ))}
    </main>
  );
};

export default CourseList;
