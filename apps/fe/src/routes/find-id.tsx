import { createFileRoute } from "@tanstack/react-router";
import FindIdPage from "@/pages/FindIdPage";

export const Route = createFileRoute("/find-id")({
  component: FindIdPage,
});
