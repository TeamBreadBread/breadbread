import type { ChatActionButton } from "@/types/curatorActions";
import type { CourseDetail } from "@/api/courses";
import { getErrorMessage } from "@/api/types/common";
import { formatCourseEstimatedTime } from "@/utils/formatCourseEstimatedTime";

export type CongestionChatContext = {
  congestedBakeryId: number;
  congestedBakeryName: string;
  alternativeBakeryId: number;
  alternativeBakeryName: string;
};

export type ChatRole = "user" | "bot";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  actions?: ChatActionButton[];
  quickReplies?: string[];
  showCourseMap?: boolean;
  showSadBread?: boolean;
  showBakeryInfoId?: number;
  congestionContext?: CongestionChatContext;
  showCelebration?: boolean;
};

export type CourseMovementBubble = {
  title: string;
  subtitle: string;
  dismissKey: string;
};

export const QUICK_REPLIES = [
  "현재 코스 설명해줘",
  "다음 빵집 추천해줘",
  "코스 순서 바꿀까?",
  "혼잡하면 어디가 좋아?",
] as const;

export const WELCOME_TITLE = "안녕하세요! 빵빵 AI 큐레이터입니다.";
export const WELCOME_SUBTITLE = "궁금한 것을 클릭해보세요!";
export const BACK_TO_START_FOOTER_LABEL = "처음으로 돌아가기";
export const COURSE_NOT_IN_PROGRESS_MESSAGE = "현재 코스 진행중이 아닙니다!";

export function buildTourCompleteCelebrationMessage(courseName: string): string {
  const label = courseName.trim() || "오늘의 빵 투어";
  return `'${label}' 완주! 🎉\n수고 많으셨어요. 달콤한 하루 보내세요!`;
}

export function getBreadBotErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);
  if (message.includes("AI 웹훅 응답이 비어") || message.includes("E0419")) {
    return COURSE_NOT_IN_PROGRESS_MESSAGE;
  }
  return message;
}

export function buildCourseExplainMessage(course: CourseDetail): string {
  const courseName = course.name?.trim() || "추천 코스";
  const bakeryCount = course.bakeries?.length ?? 0;
  const duration = formatCourseEstimatedTime(course.estimatedTime) || course.estimatedTime?.trim();
  const cost =
    Number.isFinite(course.estimatedCost) && course.estimatedCost > 0
      ? `${course.estimatedCost.toLocaleString("ko-KR")}원`
      : null;

  const metaParts = [
    duration ? `소요시간 ${duration}` : null,
    cost ? `예상비용 ${cost}` : null,
  ].filter((part): part is string => part != null);

  const routeLines = (course.bakeries ?? [])
    .map((bakery, index) => `${index + 1}. ${bakery.name?.trim() || `빵집 ${index + 1}`}`)
    .join("\n");

  const lines = [`${courseName}는 총 ${bakeryCount}곳을 방문하는 코스예요.`];
  if (metaParts.length > 0) lines.push(metaParts.join(" · "));
  if (routeLines) lines.push("", routeLines);
  lines.push("", "아래 지도에서 방문 순서를 확인해 보세요!");
  return lines.join("\n");
}

export function isCourseExplainIntent(text: string): boolean {
  return /현재\s*코스\s*설명|코스\s*설명해/.test(text.trim());
}

export function isCourseReorderIntent(text: string): boolean {
  return /코스\s*순서|순서\s*바꿀|방문\s*순서|경로\s*변경|순서\s*변경/.test(text.trim());
}

export function isNextBakeryRecommendIntent(text: string): boolean {
  return /다음\s*빵집|빵집\s*추천|다음\s*방문|다음\s*으로\s*갈/.test(text.trim());
}
