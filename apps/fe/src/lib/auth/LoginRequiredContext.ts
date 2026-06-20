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
  /** 코스 완료 축하 메시지 확인 전까지 BreadBot 유지 */
  pendingCelebrationCourseId: number | null;
  /** 코스 완료 축하 대기 시작 */
  startCelebrationPending: (courseId: number) => void;
  /** 축하 메시지 확인 완료 — BreadBot 숨김 */
  acknowledgeCelebration: () => void;
};

export const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);
