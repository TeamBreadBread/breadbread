import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakeryDetailPage from "@/pages/BbangteoBakeryDetailPage";
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

export const Route = createFileRoute("/bbangteo-bakery-detail")({
  validateSearch: (search: Record<string, unknown>) => ({
    bakeryId: parseBakeryId(search.bakeryId),
    from: parseBakeryListEntryFrom(search.from),
  }),
  component: BbangteoBakeryDetailRoute,
});

function BbangteoBakeryDetailRoute() {
  const { bakeryId, from } = Route.useSearch();
  return <BbangteoBakeryDetailPage bakeryId={bakeryId} listEntryFrom={from} />;
}
