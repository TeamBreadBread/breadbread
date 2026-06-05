import { createContext } from "react";

export type LoginRequiredContextValue = {
  /** 로그인 필요한 동작 실행. 비로그인 시 로그인 팝업을 띄운다. */
  requireLogin: (onAuthorized: () => void, redirectPath?: string) => void;
  /** 코스 안내(빵텔리전트) 세션 시작 — 로그인 사용자 전용 */
  startCourseGuide: (courseId: number) => void;
  /** 코스 안내 세션 종료 */
  endCourseGuide: () => void;
  /** 코스 안내 진행 중 여부 */
  courseGuideActive: boolean;
  /** 안내 중인 코스 ID (없으면 null) */
  courseGuideId: number | null;
};

export const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);
