import RouteListItem from "./RouteListItem";
import type { RouteCourse } from "./types";

interface RouteListSectionProps {
  courses: RouteCourse[];
  activeGuideCourseId?: number | null;
  onOpenCourse?: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export default function RouteListSection({
  courses,
  activeGuideCourseId,
  onOpenCourse,
  onDeleteCourse,
}: RouteListSectionProps) {
  return (
    <section className="w-full">
      {courses.map((course) => (
        <RouteListItem
          key={course.id}
          course={course}
          isActiveGuide={activeGuideCourseId != null && course.id === String(activeGuideCourseId)}
          onOpenCourse={onOpenCourse}
          onDeleteCourse={onDeleteCourse}
        />
      ))}
    </section>
  );
}
