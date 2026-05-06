import { createFileRoute } from "@tanstack/react-router";
import SignupResultPage from "@/pages/SignupResultPage";

export const Route = createFileRoute("/signup-result")({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: SignupResultPage,
});
