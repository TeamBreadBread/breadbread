import { cn } from "@/utils/cn";

export type AppIconSize = "x3" | "x5" | "x6" | number;

/** 디자인 토큰 색상 — CSS filter로 SVG 내장 색과 무관하게 적용 */
export type AppIconColor = "gray-500" | "gray-600" | "gray-900" | "orange-600";

const SIZE_CLASS: Record<Exclude<AppIconSize, number>, string> = {
  x3: "size-x3",
  x5: "size-x5",
  x6: "size-x6",
};

const ICON_FILTER_CLASS: Record<AppIconColor, string> = {
  "gray-500": "icon-gray-500",
  "gray-600": "icon-gray-600",
  "gray-900": "icon-gray-900",
  "orange-600": "icon-orange-600",
};

export interface AppIconProps {
  src: string;
  alt?: string;
  size?: AppIconSize;
  /** 지정 시 토큰 색상으로 아이콘을 렌더링 (바텀 네비 등) */
  color?: AppIconColor;
  className?: string;
}

export function AppIcon({ src, alt = "", size = "x6", color, className }: AppIconProps) {
  const sizeClass = typeof size === "number" ? undefined : SIZE_CLASS[size];
  const dimensionStyle = typeof size === "number" ? { width: size, height: size } : undefined;

  if (color) {
    return (
      <img
        src={src}
        alt={alt}
        aria-hidden={alt === ""}
        className={cn("shrink-0 object-contain", ICON_FILTER_CLASS[color], sizeClass, className)}
        style={dimensionStyle}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === ""}
      className={cn("shrink-0 object-contain", sizeClass, className)}
      style={dimensionStyle}
    />
  );
}
