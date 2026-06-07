import type { CourseSummaryItem } from "@/api/courses";
import CourseSection from "./CourseSection";

type CourseListProps = {
  courses: CourseSummaryItem[];
  loading: boolean;
  emptyMessage?: string;
};

const CourseList = ({
  courses,
  loading,
  emptyMessage = "표시할 코스가 없어요.",
}: CourseListProps) => {
  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center pb-[56px] sm:pb-[60px]">
        <p className="text-[14px] text-[#868b94]">코스 불러오는 중…</p>
      </main>
    );
  }

  if (courses.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-[20px] pb-[56px] sm:pb-[60px]">
        <p className="text-center text-[14px] leading-[20px] text-[#868b94]">{emptyMessage}</p>
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
