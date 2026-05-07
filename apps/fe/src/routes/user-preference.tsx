import { createFileRoute } from "@tanstack/react-router";
import BreadPreferencePage from "@/pages/BreadPreferencePage";
import UserPreferenceEditPage from "@/pages/UserPreferenceEditPage";

export const Route = createFileRoute("/user-preference")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "edit" ? "edit" : "create",
  }),
  component: UserPreferenceRouteComponent,
});

function UserPreferenceRouteComponent() {
  const search = Route.useSearch();
  if (search.mode === "edit") {
    return <UserPreferenceEditPage />;
  }
  return <BreadPreferencePage />;
}
