import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import CourseFilterBar from "./CourseFilterBar";
import CourseList from "./CourseList";
import CoursePageHeader from "./CoursePageHeader";
import type { CourseItem } from "./types";

type CourseListPageTemplateProps = {
  title: string;
  courses: CourseItem[];
};

const CourseListPageTemplate = ({ title, courses }: CourseListPageTemplateProps) => {
  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <CoursePageHeader title={title} />
        <div className="flex flex-1 flex-col">
          <CourseFilterBar />
          <CourseList courses={courses} />
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default CourseListPageTemplate;
