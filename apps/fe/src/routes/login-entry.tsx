import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginEntryPage from "@/pages/LoginEntryPage";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { parseLoginRedirectPath } from "@/lib/postLoginRedirect";

export const Route = createFileRoute("/login-entry")({
  beforeLoad: () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/home" });
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: parseLoginRedirectPath(search.redirect),
  }),
  component: LoginEntryPage,
});
