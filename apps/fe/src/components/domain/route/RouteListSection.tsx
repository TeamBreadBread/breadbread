import RouteListItem from "./RouteListItem";
import type { RouteCourse } from "./types";

interface RouteListSectionProps {
  courses: RouteCourse[];
  onDeleteCourse?: (courseId: string) => void;
}

export default function RouteListSection({ courses, onDeleteCourse }: RouteListSectionProps) {
  return (
    <section className="w-full">
      {courses.map((course) => (
        <RouteListItem key={course.id} course={course} onDeleteCourse={onDeleteCourse} />
      ))}
    </section>
  );
}
