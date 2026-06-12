import { createFileRoute } from "@tanstack/react-router";
import BreadBtiQuestionPage from "@/pages/breadbti/BreadBtiQuestionPage";

export const Route = createFileRoute("/breadbti/question")({
  component: BreadBtiQuestionPage,
});
