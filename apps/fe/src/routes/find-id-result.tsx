import { createFileRoute } from "@tanstack/react-router";
import FindIdResultPage from "@/pages/FindIdResultPage";

export const Route = createFileRoute("/find-id-result")({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === "string" ? search.name : undefined,
    loginId: typeof search.loginId === "string" ? search.loginId : undefined,
  }),
  component: FindIdResultPage,
});
