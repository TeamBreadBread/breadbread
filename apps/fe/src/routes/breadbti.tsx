import { createFileRoute, Outlet } from "@tanstack/react-router";

import { usePersistBreadBtiEntryFrom } from "@/hooks/usePersistBreadBtiEntryFrom";
import { parseBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";

export const Route = createFileRoute("/breadbti")({
  validateSearch: (search: Record<string, unknown>) => {
    const from = parseBreadBtiEntryFrom(search.from);
    return from ? { from } : {};
  },
  component: BreadBtiLayout,
});

function BreadBtiLayout() {
  const { from } = Route.useSearch();
  usePersistBreadBtiEntryFrom(from);
  return <Outlet />;
}
