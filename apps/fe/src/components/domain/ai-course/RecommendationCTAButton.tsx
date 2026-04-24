import type { ReactNode } from "react";
import Button from "@/components/common/Button/Button";
import { cn } from "@/utils/cn";

interface RecommendationCTAButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function RecommendationCTAButton({
  children,
  icon,
  className,
  onClick,
}: RecommendationCTAButtonProps) {
  return (
    <Button
      variant="primary"
      fullWidth
      className={cn("max-w-x80 gap-x2", className)}
      onClick={onClick}
    >
      {icon ? <span className="flex items-center justify-center">{icon}</span> : null}
      {children}
    </Button>
  );
}
