import { createFileRoute } from "@tanstack/react-router";
import EditProfilePage from "@/pages/EditProfilePage";

export const Route = createFileRoute("/account-settings/profile")({
  component: EditProfilePage,
});
