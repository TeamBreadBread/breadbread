import { createFileRoute } from "@tanstack/react-router";
import BreadPreference from "@/pages/BreadPreference";

// 게스트도 취향/조건 입력 화면 진입 가능 (로그인은 "추천 받기" 단계에서 유도)
export const Route = createFileRoute("/preference")({
  component: BreadPreference,
});
