import { createFileRoute } from "@tanstack/react-router";
import LoginEntryPage from "@/pages/LoginEntryPage";
import { parseLoginRedirectPath } from "@/lib/postLoginRedirect";

export const Route = createFileRoute("/login-entry")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: parseLoginRedirectPath(search.redirect),
  }),
  component: LoginEntryPage,
});
