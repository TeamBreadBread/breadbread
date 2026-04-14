import { createFileRoute } from "@tanstack/react-router";
import SignupResultPage from "@/pages/SignupResultPage";

export const Route = createFileRoute("/signup-result")({
  component: SignupResultPage,
});
