import { createFileRoute } from "@tanstack/react-router";
import LikedCoursesPage from "@/pages/LikedCoursesPage";

export const Route = createFileRoute("/my-liked-courses")({
  component: LikedCoursesPage,
});
