import type { ElementType } from "react";
import { cn } from "@/utils/cn";

type SkeletonShape = "rounded" | "circle";

type SkeletonProps = {
  as?: ElementType;
  shape?: SkeletonShape;
  className?: string;
};

const Skeleton = ({ as: Component = "div", shape = "rounded", className }: SkeletonProps) => {
  return (
    <Component
      className={cn("bg-gray-400", shape === "circle" ? "rounded-full" : "rounded-r2", className)}
    />
  );
};

export default Skeleton;
