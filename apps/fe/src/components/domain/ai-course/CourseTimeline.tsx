import CourseTimelineItem from "./CourseTimelineItem";
import type { CoursePlace } from "./types";

interface CourseTimelineProps {
  places: CoursePlace[];
}

export default function CourseTimeline({ places }: CourseTimelineProps) {
  return (
    <section className="relative overflow-hidden px-x5 py-x3">
      <div className="absolute bottom-0 left-[39px] top-0 w-[2px] bg-[#f3f4f5]" />

      <div className="flex flex-col gap-x3">
        {places.map((place, idx) => (
          <CourseTimelineItem key={place.id} index={idx + 1} place={place} />
        ))}
      </div>
    </section>
  );
}
