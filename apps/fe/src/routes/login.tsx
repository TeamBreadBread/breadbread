import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";
import { parseLoginRedirectPath } from "@/lib/postLoginRedirect";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: parseLoginRedirectPath(search.redirect),
  }),
  component: LoginPage,
});
