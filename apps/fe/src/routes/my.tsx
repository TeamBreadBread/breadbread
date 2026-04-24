import { createFileRoute } from "@tanstack/react-router";
import MyPage from "@/pages/MyPage";

export const Route = createFileRoute("/my")({
  component: MyPage,
});
