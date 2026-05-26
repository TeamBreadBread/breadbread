import { createFileRoute } from "@tanstack/react-router";
import ChangePhonePage from "@/pages/ChangePhonePage";

export const Route = createFileRoute("/account-settings/phone")({
  component: ChangePhonePage,
});
