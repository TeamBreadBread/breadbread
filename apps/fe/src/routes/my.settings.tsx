import { createFileRoute } from "@tanstack/react-router";
import MyServiceSettingsPage from "@/pages/MyServiceSettingsPage";

export const Route = createFileRoute("/my/settings")({
  component: MyServiceSettingsPage,
});
