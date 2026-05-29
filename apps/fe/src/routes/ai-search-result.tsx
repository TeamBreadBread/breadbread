import { createFileRoute } from "@tanstack/react-router";
import AISearchResultPage from "@/pages/AISearchResultPage";

function parseCourseId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.floor(value);
    return parsed > 0 ? parsed : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

type AISearchResultSearch = {
  courseId: number | null;
  from?: "route";
};

export const Route = createFileRoute("/ai-search-result")({
  validateSearch: (search: Record<string, unknown>): AISearchResultSearch => ({
    courseId: parseCourseId(search.courseId),
    ...(search.from === "route" ? { from: "route" as const } : {}),
  }),
  component: AISearchResultRoute,
});

function AISearchResultRoute() {
  const search = Route.useSearch();
  return <AISearchResultPage courseId={search.courseId} from={search.from} />;
}
