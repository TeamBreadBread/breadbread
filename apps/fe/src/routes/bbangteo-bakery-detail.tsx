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

function parseBoolean(value: unknown): boolean | undefined {
  if (value == null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
    return undefined;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return undefined;
}

export const Route = createFileRoute("/bbangteo-bakery-detail")({
  validateSearch: (search: Record<string, unknown>) => ({
    bakeryId: parseBakeryId(search.bakeryId),
    from: parseBakeryListEntryFrom(search.from),
    reviewUploaded: parseBoolean(search.reviewUploaded),
    reviewTab: parseBoolean(search.reviewTab),
  }),
  component: BbangteoBakeryDetailRoute,
});

function BbangteoBakeryDetailRoute() {
  const { bakeryId, from, reviewUploaded, reviewTab } = Route.useSearch();
  return (
    <BbangteoBakeryDetailPage
      bakeryId={bakeryId}
      listEntryFrom={from}
      reviewUploaded={Boolean(reviewUploaded || reviewTab)}
    />
  );
}
