import { createFileRoute } from "@tanstack/react-router";
import MyUserPostsListPage from "@/pages/MyUserPostsListPage";

export const Route = createFileRoute("/my-liked-posts")({
  component: () => <MyUserPostsListPage variant="liked" />,
});
