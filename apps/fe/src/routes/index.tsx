import { createFileRoute } from "@tanstack/react-router";
import AiCoursePage from "@/pages/AiCoursePage";

export const Route = createFileRoute("/")({
  component: AiCoursePage,
});
