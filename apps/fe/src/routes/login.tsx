import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { redirectLoggedInUserFromLanding } from "@/lib/auth/preferenceOnboardingGate";
import { parseLoginRedirectPath } from "@/lib/postLoginRedirect";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    if (isLoggedIn()) {
      await redirectLoggedInUserFromLanding();
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: parseLoginRedirectPath(search.redirect),
  }),
  component: LoginPage,
});
