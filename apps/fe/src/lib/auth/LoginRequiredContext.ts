import { createContext } from "react";

/** 챗봇 말풍선 종류 */
export type BotBubble =
  | { kind: "info"; text: string }
  | { kind: "login"; text: string; redirectPath?: string };

export type LoginRequiredContextValue = {
  /** 로그인 필요한 동작 실행. 비로그인 시 챗봇 말풍선(게스트/로그인)을 띄운다. */
  requireLogin: (onAuthorized: () => void, redirectPath?: string) => void;
  /** 로그인 필요 페이지 입장 시 비로그인 사용자에게 안내 말풍선을 띄운다. */
  promptLoginOnEnter: (redirectPath?: string) => void;
  /** 단순 안내(예: 홈 첫 진입 로그인 유도) 말풍선 */
  showInfoBubble: (text: string) => void;
  /** 챗봇 큐레이터 채팅에 전달할 코스 컨텍스트 설정 */
  setBotCourseId: (courseId: number | null) => void;
};

export const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);
