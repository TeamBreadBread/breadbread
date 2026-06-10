import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakeryListPage from "@/pages/BbangteoBakeryListPage";
import {
  parseBakeryListEntryFrom,
  parseBreadKeywordParam,
  parseCurationOnlyParam,
  parseCurationPinsParam,
  parseDongFilterParam,
} from "@/utils/bakeryListEntry";

export const Route = createFileRoute("/bbangteo-bakery-list")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: parseBakeryListEntryFrom(search.from),
    curationOnly: parseCurationOnlyParam(search.curationOnly),
    dong: parseDongFilterParam(search.dong),
    curationPins: parseCurationPinsParam(search.curationPins) ?? [],
    excludePins: parseCurationPinsParam(search.excludePins) ?? [],
    breadKeyword: parseBreadKeywordParam(search.breadKeyword),
  }),
  component: BbangteoBakeryListRoute,
});

function BbangteoBakeryListRoute() {
  const { from, curationOnly, dong, curationPins, excludePins, breadKeyword } = Route.useSearch();
  return (
    <BbangteoBakeryListPage
      listEntryFrom={from}
      curationOnly={curationOnly}
      dongFilter={dong}
      curationPinIds={curationPins}
      excludePinIds={excludePins}
      breadKeyword={breadKeyword}
    />
  );
}
