import { createFileRoute } from "@tanstack/react-router";
import BbangteoBoardPage from "@/pages/BbangteoBoardPage";

function parseListRefresh(value: unknown): number | undefined {
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

export const Route = createFileRoute("/bbangteo-board")({
  validateSearch: (search: Record<string, unknown>) => ({
    listRefresh: parseListRefresh(search.listRefresh),
  }),
  component: BbangteoBoardRoute,
});

function BbangteoBoardRoute() {
  const { listRefresh } = Route.useSearch();
  return <BbangteoBoardPage initialTab="자유 게시판" listRefresh={listRefresh} />;
}
