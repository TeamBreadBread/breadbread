import RouteListItem from "./RouteListItem";
import type { RouteCourse } from "./types";

interface RouteListSectionProps {
  courses: RouteCourse[];
}

export default function RouteListSection({ courses }: RouteListSectionProps) {
  return (
    <section className="w-full">
      {courses.map((course) => (
        <RouteListItem key={course.id} course={course} />
      ))}
    </section>
  );
}
