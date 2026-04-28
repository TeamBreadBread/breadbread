import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakeryListPage from "@/pages/BbangteoBakeryListPage";

export const Route = createFileRoute("/bbangteo-bakery-list")({
  component: BbangteoBakeryListPage,
});
