export type CoachMarkStepId =
  | "ai-recommendation"
  | "quick-menu"
  | "bottom-nav"
  | "bottom-nav-my"
  | "finish";

export type CoachMarkStep = {
  id: CoachMarkStepId;
  title: string;
  body: string;
  primaryLabel: string;
  /** Spotlight 대상 `data-coach-target` — finish 단계는 null */
  target: string | null;
  spotlightRadius?: number;
};

export function formatCoachMarkProgress(stepIndex: number, totalSteps: number): string {
  return `${stepIndex + 1} / ${totalSteps}`;
}

export const COACH_MARK_TARGETS = {
  aiRecommendation: "ai-recommendation",
  quickMenu: "quick-menu",
  bottomNav: "bottom-nav",
  bottomNavMy: "bottom-nav-my",
} as const;

export const COACH_MARK_STEPS: CoachMarkStep[] = [
  {
    id: "ai-recommendation",
    target: COACH_MARK_TARGETS.aiRecommendation,
    title: "AI 빵집 추천",
    body: "AI가 취향에 맞는 빵집 코스를 추천해드려요.",
    primaryLabel: "다음",
    spotlightRadius: 8,
  },
  {
    id: "quick-menu",
    target: COACH_MARK_TARGETS.quickMenu,
    title: "빠른 메뉴",
    body: "원하는 테마의 빵집 코스를 직접 둘러볼 수도 있어요.",
    primaryLabel: "다음",
    spotlightRadius: 8,
  },
  {
    id: "bottom-nav",
    target: COACH_MARK_TARGETS.bottomNav,
    title: "하단 메뉴",
    body: "하단 메뉴에서 언제든 원하는 기능으로 이동할 수 있어요.",
    primaryLabel: "다음",
    spotlightRadius: 0,
  },
  {
    id: "bottom-nav-my",
    target: COACH_MARK_TARGETS.bottomNavMy,
    title: "MY",
    body: "선호도 수정과 활동 내역은 MY에서 확인할 수 있어요.",
    primaryLabel: "다음",
    spotlightRadius: 8,
  },
  {
    id: "finish",
    target: null,
    title: "준비 완료!",
    body: "이제 준비가 끝났어요.\nAI 추천을 받아보세요!",
    primaryLabel: "시작하기",
    spotlightRadius: 0,
  },
];

export const COACH_MARK_SPOTLIGHT_PADDING = 8;
