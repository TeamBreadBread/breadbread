import { createFileRoute } from "@tanstack/react-router";
import BreadBtiLoadingPage from "@/pages/breadbti/BreadBtiLoadingPage";

export const Route = createFileRoute("/breadbti/loading")({
  component: BreadBtiLoadingPage,
});
