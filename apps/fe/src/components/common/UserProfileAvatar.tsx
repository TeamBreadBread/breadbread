import { useState } from "react";

import { resolveProfileImageUrl } from "@/utils/defaultProfileAvatar";
import { cn } from "@/utils/cn";

type UserProfileAvatarProps = {
  profileImageUrl?: string | null;
  /** 커스텀 프로필 없을 때 기본 아바타 선택용 (userId, loginId, nickname 등) */
  seed?: string;
  className?: string;
  alt?: string;
};

export function UserProfileAvatar({
  profileImageUrl,
  seed,
  className,
  alt = "",
}: UserProfileAvatarProps) {
  const [useFallback, setUseFallback] = useState(false);
  const src = resolveProfileImageUrl(useFallback ? null : profileImageUrl, seed);

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => {
        if (!useFallback) {
          setUseFallback(true);
        }
      }}
    />
  );
}
