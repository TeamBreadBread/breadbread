import { createFileRoute } from "@tanstack/react-router";
import BbangteoBoardWritePage from "@/pages/BbangteoBoardWritePage";

function parseEditId(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export const Route = createFileRoute("/bbangteo-board-write")({
  validateSearch: (search: Record<string, unknown>) => ({
    editId: parseEditId(search.editId),
  }),
  component: BbangteoBoardWriteRoute,
});

function BbangteoBoardWriteRoute() {
  const { editId } = Route.useSearch();
  return <BbangteoBoardWritePage editPostId={editId > 0 ? editId : undefined} />;
}
