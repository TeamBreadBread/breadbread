import { createFileRoute } from "@tanstack/react-router";
import MySupportPage from "@/pages/MySupportPage";

export const Route = createFileRoute("/my/support")({
  component: MySupportPage,
});
