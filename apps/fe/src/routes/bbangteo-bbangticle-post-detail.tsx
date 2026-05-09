import { createFileRoute } from "@tanstack/react-router";
import BbangticlePostDetailPage from "@/pages/BbangteoBbangticlePostDetailPage";

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

export const Route = createFileRoute("/bbangteo-bbangticle-post-detail")({
  validateSearch: (search: Record<string, unknown>) => ({
    postId: parsePostId(search.postId),
  }),
  component: BbangteoBbangticlePostDetailRoute,
});

function BbangteoBbangticlePostDetailRoute() {
  const { postId } = Route.useSearch();
  return <BbangticlePostDetailPage postId={postId} listPath="/bbangteo-article-board" />;
}
