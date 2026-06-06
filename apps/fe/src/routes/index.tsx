import { createFileRoute, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import LandingPage from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (isLoggedIn()) {
      throw redirect({ to: "/home" });
    }
  },
  component: LandingPage,
});
