import { createFileRoute } from "@tanstack/react-router";
import AISearchResultPage from "@/pages/AISearchResultPage";

export const Route = createFileRoute("/")({
  component: AISearchResultPage,
});
