import { createFileRoute } from "@tanstack/react-router";
import LikedBakeriesPage from "@/pages/LikedBakeriesPage";

export const Route = createFileRoute("/my-liked-bakeries")({
  component: LikedBakeriesPage,
});
