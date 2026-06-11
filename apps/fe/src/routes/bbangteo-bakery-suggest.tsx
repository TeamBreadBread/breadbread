import { createFileRoute } from "@tanstack/react-router";
import BbangteoBakerySuggestPage from "@/pages/BbangteoBakerySuggestPage";
import { redirectToLoginIfUnauthenticated } from "@/lib/requireAuth";

export const Route = createFileRoute("/bbangteo-bakery-suggest")({
  beforeLoad: () => {
    redirectToLoginIfUnauthenticated("/bbangteo-bakery-suggest");
  },
  component: BbangteoBakerySuggestRoute,
});

function BbangteoBakerySuggestRoute() {
  return <BbangteoBakerySuggestPage />;
}
