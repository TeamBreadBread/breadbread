import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredAccessToken } from "@/api/auth";
import LoginEntryPage from "@/pages/LoginEntryPage";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (getStoredAccessToken()) {
      throw redirect({ to: "/home" });
    }
  },
  component: LoginEntryPage,
});
