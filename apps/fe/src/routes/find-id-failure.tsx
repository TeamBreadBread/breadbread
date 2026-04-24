import { createFileRoute } from "@tanstack/react-router";
import FindIdFailurePage from "@/pages/FindIdFailurePage";

export const Route = createFileRoute("/find-id-failure")({
  component: FindIdFailurePage,
});
