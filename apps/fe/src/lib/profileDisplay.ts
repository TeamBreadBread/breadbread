import { getDisplayNameForLoginId, getUserProfile } from "@/lib/userProfileCache";
import { getUserIdFromAccessToken } from "@/utils/accessTokenClaims";

/** MyPage 상단과 동일한 표시 이름 (캐시된 `/users/me` 기준) */
export function resolveMyPageDisplayName(): string {
  const profile = getUserProfile();
  if (profile?.name?.trim()) {
    return profile.name.trim();
  }
  if (profile?.loginId?.trim()) {
    return getDisplayNameForLoginId(profile.loginId);
  }
  return "회원";
}

/** 로그인한 회원 ID — 프로필 캐시의 userId 우선, 없으면 JWT subject */
export function getViewerUserId(): number | undefined {
  const profile = getUserProfile();
  if (
    typeof profile?.userId === "number" &&
    Number.isFinite(profile.userId) &&
    profile.userId > 0
  ) {
    return profile.userId;
  }
  return getUserIdFromAccessToken();
}
