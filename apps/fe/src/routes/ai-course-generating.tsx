import { createFileRoute, redirect } from "@tanstack/react-router";
import AiCourseGeneratingPage from "@/pages/AiCourseGeneratingPage";

export const Route = createFileRoute("/ai-course-generating")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: typeof search.jobId === "string" ? search.jobId.trim() : "",
  }),
  beforeLoad: ({ search }) => {
    if (!search.jobId) {
      throw redirect({ to: "/recommendation" });
    }
  },
  component: AiCourseGeneratingRoute,
});

function AiCourseGeneratingRoute() {
  const { jobId } = Route.useSearch();
  return <AiCourseGeneratingPage jobId={jobId} />;
}
