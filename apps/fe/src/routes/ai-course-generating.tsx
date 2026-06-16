import { createFileRoute, redirect } from "@tanstack/react-router";
import AiCourseGeneratingPage from "@/pages/AiCourseGeneratingPage";
import { redirectToLoginIfUnauthenticated } from "@/lib/requireAuth";

export const AI_COURSE_GENERATING_PREVIEW_JOB_ID = "preview";

export const Route = createFileRoute("/ai-course-generating")({
  validateSearch: (search: Record<string, unknown>) => ({
    jobId: typeof search.jobId === "string" ? search.jobId.trim() : "",
  }),
  beforeLoad: ({ search }) => {
    const isDevPreview =
      import.meta.env.DEV && search.jobId === AI_COURSE_GENERATING_PREVIEW_JOB_ID;
    if (!isDevPreview) {
      redirectToLoginIfUnauthenticated("/recommendation");
    }
    if (!search.jobId) {
      throw redirect({ to: "/recommendation" });
    }
  },
  component: AiCourseGeneratingRoute,
});

function AiCourseGeneratingRoute() {
  const { jobId } = Route.useSearch();
  const isDevPreview = import.meta.env.DEV && jobId === AI_COURSE_GENERATING_PREVIEW_JOB_ID;
  return <AiCourseGeneratingPage jobId={jobId} preview={isDevPreview} />;
}
