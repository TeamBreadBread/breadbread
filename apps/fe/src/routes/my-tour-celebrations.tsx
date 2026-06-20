import { createFileRoute } from "@tanstack/react-router";
import MyTourCelebrationPage from "@/pages/MyTourCelebrationPage";

export const Route = createFileRoute("/my-tour-celebrations")({
  component: MyTourCelebrationPage,
});
