import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakerySuggestPage from "@/pages/BbangteoBakerySuggestPage";

export const Route = createFileRoute("/bbangteo-bakery-suggest")({
  component: BbangteoBakerySuggestRoute,
});

function BbangteoBakerySuggestRoute() {
  return <BbangteoBakerySuggestPage />;
}
