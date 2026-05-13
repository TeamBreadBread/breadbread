import { createFileRoute } from "@tanstack/react-router";
import BbangteoBoardPage from "@/pages/BbangteoBoardPage";

export const Route = createFileRoute("/bbangteo-board")({
  component: () => <BbangteoBoardPage initialTab="자유 게시판" />,
});
