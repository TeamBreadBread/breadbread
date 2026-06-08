import { pickCourseBreadIcon } from "@/lib/courseBreadIcons";
import { cn } from "@/utils/cn";

/** 빵 카테고리 일러스트 SVG 원본 크기 */
export const COURSE_BREAD_ICON_SIZE = 44;

type CourseBreadThumbnailProps = {
  seed: string | number;
  size?: number;
  className?: string;
};

/** 코스별 빵 카테고리 일러스트 — SVG를 지정 px 크기 그대로 렌더링한다. */
export default function CourseBreadThumbnail({
  seed,
  size = COURSE_BREAD_ICON_SIZE,
  className,
}: CourseBreadThumbnailProps) {
  const src = pickCourseBreadIcon(seed);

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      width={size}
      height={size}
      className={cn("block shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
