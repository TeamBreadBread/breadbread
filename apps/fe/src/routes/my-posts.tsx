import { createFileRoute } from "@tanstack/react-router";
import MyUserPostsListPage from "@/pages/MyUserPostsListPage";

export const Route = createFileRoute("/my-posts")({
  component: () => <MyUserPostsListPage variant="mine" />,
});
