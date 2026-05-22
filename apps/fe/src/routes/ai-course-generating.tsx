import { createFileRoute, redirect } from "@tanstack/react-router";
import AiCourseGeneratingPage from "@/pages/AiCourseGeneratingPage";
import { redirectToLoginIfUnauthenticated } from "@/lib/requireAuth";

export const Route = createFileRoute("/ai-course-generating")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: typeof search.jobId === "string" ? search.jobId.trim() : "",
  }),
  beforeLoad: ({ search }) => {
    redirectToLoginIfUnauthenticated("/recommendation");
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
