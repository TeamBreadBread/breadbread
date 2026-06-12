import { createFileRoute } from "@tanstack/react-router";
import BreadBtiResultPage from "@/pages/breadbti/BreadBtiResultPage";

export const Route = createFileRoute("/breadbti/result")({
  component: BreadBtiResultPage,
});
