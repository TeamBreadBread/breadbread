import { createFileRoute } from "@tanstack/react-router";
import GoogleCallbackPage from "@/pages/GoogleCallbackPage";

export const Route = createFileRoute("/auth/google/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_description:
      typeof search.error_description === "string" ? search.error_description : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
  }),
  component: function GoogleOAuthCallbackRoute() {
    const { code, error, error_description, state } = Route.useSearch();
    return (
      <GoogleCallbackPage
        code={code}
        error={error}
        error_description={error_description}
        returnedState={state}
      />
    );
  },
});
