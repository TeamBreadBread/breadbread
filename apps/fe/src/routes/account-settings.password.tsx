import { createFileRoute } from "@tanstack/react-router";
import ChangePasswordPage from "@/pages/ChangePasswordPage";

export const Route = createFileRoute("/account-settings/password")({
  component: ChangePasswordPage,
});
