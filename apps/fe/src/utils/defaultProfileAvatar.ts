import profileBlue from "@/assets/images/color=blue.svg";
import profileGreen from "@/assets/images/color=green.svg";
import profileOrange from "@/assets/images/color=orange.svg";
import profilePurple from "@/assets/images/color=purple.svg";
import profileRed from "@/assets/images/color=red.svg";
import { getSafeImageUrl } from "@/utils/safeImageUrl";

const DEFAULT_PROFILE_AVATARS = [
  profileBlue,
  profileGreen,
  profileOrange,
  profilePurple,
  profileRed,
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 사용자별로 동일한 기본 프로필 아바타를 고정 선택한다. */
export function pickDefaultProfileAvatar(seed?: string): string {
  const key = seed?.trim() || "guest";
  const index = hashSeed(key) % DEFAULT_PROFILE_AVATARS.length;
  return DEFAULT_PROFILE_AVATARS[index] ?? DEFAULT_PROFILE_AVATARS[0];
}

export function resolveProfileImageUrl(profileImageUrl?: string | null, seed?: string): string {
  const custom = getSafeImageUrl(profileImageUrl ?? undefined);
  if (custom) return custom;
  return pickDefaultProfileAvatar(seed);
}
