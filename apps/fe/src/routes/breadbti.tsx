import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

import { usePersistBreadBtiEntryFrom } from "@/hooks/usePersistBreadBtiEntryFrom";
import { parseBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";
import { saveAiCourseBtiReturnJobId, saveAiCoursePendingJobId } from "@/utils/aiCourseStorage";

export const Route = createFileRoute("/breadbti")({
  validateSearch: (search: Record<string, unknown>) => {
    const from = parseBreadBtiEntryFrom(search.from);
    const jobId = typeof search.jobId === "string" ? search.jobId.trim() : "";
    return {
      ...(from ? { from } : {}),
      ...(jobId ? { jobId } : {}),
    };
  },
  component: BreadBtiLayout,
});

function BreadBtiLayout() {
  const { from, jobId } = Route.useSearch();
  usePersistBreadBtiEntryFrom(from);

  useEffect(() => {
    if (from !== "ai-generating" || !jobId || jobId === "preview") return;
    saveAiCourseBtiReturnJobId(jobId);
    saveAiCoursePendingJobId(jobId);
  }, [from, jobId]);

  return <Outlet />;
}
