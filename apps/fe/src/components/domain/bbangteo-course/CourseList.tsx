import CourseSection from "./CourseSection";
import type { CourseItem } from "./types";

type CourseListProps = {
  courses: CourseItem[];
};

const CourseList = ({ courses }: CourseListProps) => {
  return (
    <main className="flex flex-1 flex-col gap-[10px] overflow-y-auto pb-[56px] sm:pb-[60px]">
      {courses.map((course) => (
        <CourseSection key={course.id} course={course} />
      ))}
    </main>
  );
};

export default CourseList;
