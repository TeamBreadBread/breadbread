import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakeryReviewWritePage from "@/pages/BbangteoBakeryReviewWritePage";
import { parseBakeryListEntryFrom } from "@/utils/bakeryListEntry";

function parseBakeryId(value: unknown): number | undefined {
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

export const Route = createFileRoute("/bbangteo-bakery-review-write")({
  validateSearch: (search: Record<string, unknown>) => ({
    bakeryId: parseBakeryId(search.bakeryId),
    reviewId: parseBakeryId(search.reviewId),
    from: parseBakeryListEntryFrom(search.from),
  }),
  component: BbangteoBakeryReviewWriteRoute,
});

function BbangteoBakeryReviewWriteRoute() {
  const { bakeryId, reviewId, from } = Route.useSearch();
  return (
    <BbangteoBakeryReviewWritePage bakeryId={bakeryId} reviewId={reviewId} listEntryFrom={from} />
  );
}
