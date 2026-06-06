import { createFileRoute, redirect } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { parseLoginRedirectPath } from "@/lib/postLoginRedirect";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/home" });
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: parseLoginRedirectPath(search.redirect),
  }),
  component: LoginPage,
});
