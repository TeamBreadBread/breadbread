import { createFileRoute } from "@tanstack/react-router";
import MyReviewsPage from "@/pages/MyReviewsPage";

export const Route = createFileRoute("/my-reviews")({
  component: MyReviewsPage,
});
