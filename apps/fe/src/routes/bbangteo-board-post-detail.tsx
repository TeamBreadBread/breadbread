import { createFileRoute } from "@tanstack/react-router";
import FreeBoardPostDetailPage from "@/pages/BbangteoFreeBoardPostDetailPage";

function parsePostId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return undefined;
}

function parseDetailRefresh(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return undefined;
}

export const Route = createFileRoute("/bbangteo-board-post-detail")({
  validateSearch: (search: Record<string, unknown>) => ({
    postId: parsePostId(search.postId),
    detailRefresh: parseDetailRefresh(search.detailRefresh),
  }),
  component: BbangteoBoardPostDetailRoute,
});

function BbangteoBoardPostDetailRoute() {
  const { postId, detailRefresh } = Route.useSearch();
  return (
    <FreeBoardPostDetailPage
      postId={postId}
      listPath="/bbangteo-board"
      detailRefresh={detailRefresh}
    />
  );
}
