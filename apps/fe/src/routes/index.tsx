import { createFileRoute } from "@tanstack/react-router";
import LoginEntryPage from "@/pages/LoginEntryPage";

export const Route = createFileRoute("/")({
  component: LoginEntryPage,
});
