import { createFileRoute } from "@tanstack/react-router";
import BreadPreference from "@/pages/BreadPreference";
import { redirectToLoginIfUnauthenticated } from "@/lib/requireAuth";

export const Route = createFileRoute("/preference")({
  beforeLoad: () => {
    redirectToLoginIfUnauthenticated("/preference");
  },
  component: BreadPreference,
});
