import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakeryListPage from "@/pages/BbangteoBakeryListPage";
import { parseBakeryListEntryFrom } from "@/utils/bakeryListEntry";

export const Route = createFileRoute("/bbangteo-bakery-list")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: parseBakeryListEntryFrom(search.from),
  }),
  component: BbangteoBakeryListRoute,
});

function BbangteoBakeryListRoute() {
  const { from } = Route.useSearch();
  return <BbangteoBakeryListPage listEntryFrom={from} />;
}
