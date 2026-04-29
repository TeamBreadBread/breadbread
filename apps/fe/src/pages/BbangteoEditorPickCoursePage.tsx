import CourseListPageTemplate from "@/components/domain/bbangteo-course/CourseListPageTemplate";
import type { CourseItem } from "@/components/domain/bbangteo-course/types";

const courses: CourseItem[] = [
  { id: 1, name: "코스 이름", image: "Frame 583600_4511.png" },
  { id: 2, name: "코스 이름", image: "Frame 583600_4594.png" },
  { id: 3, name: "코스 이름", image: "Frame 583600_4677.png" },
];

const BbangteoEditorPickCoursePage = () => {
  return <CourseListPageTemplate title="에디터픽 추천 코스" courses={courses} />;
};

export default BbangteoEditorPickCoursePage;
