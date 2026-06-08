import RouteListItem from "./RouteListItem";
import type { RouteCourse } from "./types";

interface RouteListSectionProps {
  courses: RouteCourse[];
  onOpenCourse?: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export default function RouteListSection({
  courses,
  onOpenCourse,
  onDeleteCourse,
}: RouteListSectionProps) {
  return (
    <section className="w-full">
      {courses.map((course) => (
        <RouteListItem
          key={course.id}
          course={course}
          onOpenCourse={onOpenCourse}
          onDeleteCourse={onDeleteCourse}
        />
      ))}
    </section>
  );
}
