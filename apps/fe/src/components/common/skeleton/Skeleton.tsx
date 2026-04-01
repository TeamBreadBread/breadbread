import type { ElementType } from "react";

type SkeletonShape = "rounded" | "circle";

type SkeletonProps = {
  as?: ElementType;
  shape?: SkeletonShape;
  className?: string;
};

const Skeleton = ({ as: Component = "div", shape = "rounded", className }: SkeletonProps) => {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-r2";

  return <Component className={`bg-gray-400 ${shapeClass} ${className ?? ""}`} />;
};

export default Skeleton;
