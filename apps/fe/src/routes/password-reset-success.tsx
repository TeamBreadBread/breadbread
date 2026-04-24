import { createFileRoute } from "@tanstack/react-router";
import PasswordResetSuccessPage from "@/pages/PasswordResetSuccessPage";

export const Route = createFileRoute("/password-reset-success")({
  component: PasswordResetSuccessPage,
});
