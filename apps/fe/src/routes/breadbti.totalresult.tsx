import { createFileRoute } from "@tanstack/react-router";
import BreadBtiTotalResultPage from "@/pages/breadbti/BreadBtiTotalResultPage";

export const Route = createFileRoute("/breadbti/totalresult")({
  component: BreadBtiTotalResultPage,
});
