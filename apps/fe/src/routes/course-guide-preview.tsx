import { createFileRoute, redirect } from "@tanstack/react-router";
import CourseGuidePreviewPage from "@/pages/CourseGuidePreviewPage";
import { parseCourseGuidePreviewSearch } from "@/lib/courseGuidePreviewNavigation";

export const Route = createFileRoute("/course-guide-preview")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = parseCourseGuidePreviewSearch(search);
    if (!parsed) {
      throw redirect({ to: "/home" });
    }
    return parsed;
  },
  component: CourseGuidePreviewRoute,
});

function CourseGuidePreviewRoute() {
  const search = Route.useSearch();
  return (
    <CourseGuidePreviewPage
      courseId={search.courseId}
      transportMode={search.transportMode}
      returnFrom={search.returnFrom}
    />
  );
}
