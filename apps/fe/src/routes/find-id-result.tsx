import { createFileRoute } from "@tanstack/react-router";
import FindIdResultPage from "@/pages/FindIdResultPage";

export const Route = createFileRoute("/find-id-result")({
  component: FindIdResultPage,
});
