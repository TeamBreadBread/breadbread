import { createFileRoute } from "@tanstack/react-router";
import BbangteoBoardWritePage from "@/pages/BbangteoBoardWritePage";

function parseEditPostId(value: unknown): number | undefined {
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

/** 검색 스키마를 두어 `editPostId`가 location.search에 포함·파싱되도록 함 (미등록 시 수정 화면이 빈 폼으로 뜸) */
export const Route = createFileRoute("/bbangteo-board-write")({
  validateSearch: (search: Record<string, unknown>) => ({
    editPostId: parseEditPostId(search.editPostId),
  }),
  component: BbangteoBoardWriteRoute,
});

function BbangteoBoardWriteRoute() {
  const { editPostId } = Route.useSearch();
  return <BbangteoBoardWritePage editPostId={editPostId} />;
}
