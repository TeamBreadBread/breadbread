import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakeryListPage from "@/pages/BbangteoBakeryListPage";
import { parseBakeryListEntryFrom, parseCurationPinsParam } from "@/utils/bakeryListEntry";

export const Route = createFileRoute("/bbangteo-bakery-list")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: parseBakeryListEntryFrom(search.from),
    curationPins: parseCurationPinsParam(search.curationPins) ?? [],
  }),
  component: BbangteoBakeryListRoute,
});

function BbangteoBakeryListRoute() {
  const { from, curationPins } = Route.useSearch();
  return <BbangteoBakeryListPage listEntryFrom={from} curationPinIds={curationPins} />;
}
