import {
  isCoachMarkCompletedForUser,
  markCoachMarkCompleted,
} from "@/components/coach-mark/coachMarkStorage";
import { getUserProfile } from "@/lib/userProfileCache";

/**
 * BE `firstLogin` / `onboardingCompleted` API 연동 시 이 resolver를 등록합니다.
 * @example
 * registerCoachMarkServerResolver(async () => {
 *   const { firstLogin, onboardingCompleted } = await getUserOnboardingStatus();
 *   return {
 *     shouldShow: firstLogin && !onboardingCompleted,
 *     markCompletedLocally: onboardingCompleted,
 *   };
 * });
 */
export type CoachMarkServerEligibility = {
  shouldShow: boolean;
  /** BE에서 이미 완료된 경우 FE localStorage 동기화 */
  markCompletedLocally?: boolean;
};

export type CoachMarkServerResolver = () => Promise<CoachMarkServerEligibility | null>;

let serverResolver: CoachMarkServerResolver | null = null;

export function registerCoachMarkServerResolver(resolver: CoachMarkServerResolver): void {
  serverResolver = resolver;
}

export function unregisterCoachMarkServerResolver(): void {
  serverResolver = null;
}

function resolveLoggedInUserId(): number | null {
  const profile = getUserProfile();
  const userId = profile?.userId;
  return userId != null && userId > 0 ? userId : null;
}

/**
 * Home Coach Mark 노출 여부.
 * - DEV: 항상 true (localStorage 무시)
 * - PROD: 로그인 userId 기준 localStorage 미완료 + (선택) serverResolver
 */
export async function resolveShouldShowHomeCoachMark(): Promise<boolean> {
  if (import.meta.env.DEV) {
    return true;
  }

  const userId = resolveLoggedInUserId();
  if (userId == null) return false;

  if (isCoachMarkCompletedForUser(userId)) {
    return false;
  }

  if (serverResolver) {
    const server = await serverResolver();
    if (server) {
      if (server.markCompletedLocally) {
        markCoachMarkCompleted(userId);
      }
      return server.shouldShow;
    }
  }

  return true;
}

/** Skip / Finish 시 호출 — localStorage 저장 (DEV에서도 저장해 prod 동작 검증 가능) */
export function persistCoachMarkDismissed(): void {
  const userId = resolveLoggedInUserId();
  if (userId == null) return;

  markCoachMarkCompleted(userId);

  // TODO(BE): void syncCoachMarkCompletedToServer(userId);
}
