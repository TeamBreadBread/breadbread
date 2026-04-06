import CourseTimelineItem from "./CourseTimelineItem";

interface Course {
  name: string;
  address: string;
  menu: string;
}

interface CourseTimelineProps {
  courses: Course[];
}

export default function CourseTimeline({ courses }: CourseTimelineProps) {
  return (
    <section className="px-x5 py-x3">
      <div className="flex flex-col gap-x3">
        {courses.map((course, idx) => (
          <CourseTimelineItem
            key={`${course.name}-${idx}`}
            index={idx + 1}
            isLast={idx === courses.length - 1}
            {...course}
          />
        ))}
      </div>
    </section>
  );
}
