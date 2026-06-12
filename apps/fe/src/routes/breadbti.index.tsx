import { createFileRoute } from "@tanstack/react-router";
import BreadBtiLandingPage from "@/pages/breadbti/BreadBtiLandingPage";

export const Route = createFileRoute("/breadbti/")({
  component: BreadBtiLandingPage,
});
