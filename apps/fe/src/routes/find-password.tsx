import { createFileRoute } from "@tanstack/react-router";
import FindPasswordPage from "@/pages/FindPasswordPage";

export const Route = createFileRoute("/find-password")({
  component: FindPasswordPage,
});
