import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

/** 게시글 상세 — 목록 버튼(케밥), 좋아요(하트) */
export function ToolbarHamburgerIcon({
  size = 22,
  className = "shrink-0",
}: {
  size?: number;
  className?: string;
}) {
  return <AppIcon src={IconAssets.IcKebab} size={size} className={className} />;
}

export function ToolbarHeartLikeIcon({
  liked,
  size = 22,
  className,
}: {
  liked: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <AppIcon
      src={IconAssets.IcHeart}
      size={size}
      className={cn(liked ? "red_700" : "opacity-45", className)}
    />
  );
}
