import { cn } from "@/utils/cn";

export type AppIconSize = "x3" | "x5" | "x6" | number;

const SIZE_CLASS: Record<Exclude<AppIconSize, number>, string> = {
  x3: "size-x3",
  x5: "size-x5",
  x6: "size-x6",
};

export interface AppIconProps {
  src: string;
  alt?: string;
  size?: AppIconSize;
  className?: string;
}

export function AppIcon({ src, alt = "", size = "x6", className }: AppIconProps) {
  const sizeClass = typeof size === "number" ? undefined : SIZE_CLASS[size];
  const dimensionStyle = typeof size === "number" ? { width: size, height: size } : undefined;

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
