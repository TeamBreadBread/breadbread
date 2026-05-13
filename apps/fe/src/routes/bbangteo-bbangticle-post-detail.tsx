import { createFileRoute } from "@tanstack/react-router";
import BbangteoPostDetailView from "@/pages/BbangteoPostDetailView";

function parsePostId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value !== 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed) && parsed !== 0) return parsed;
  }
  return 0;
}

export const Route = createFileRoute("/bbangteo-bbangticle-post-detail")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: parsePostId(search.id),
  }),
  component: BbangteoBbangticlePostDetailRoute,
});

function BbangteoBbangticlePostDetailRoute() {
  const { id } = Route.useSearch();
  return <BbangteoPostDetailView postId={id} listPath="/bbangteo-article-board" />;
}
