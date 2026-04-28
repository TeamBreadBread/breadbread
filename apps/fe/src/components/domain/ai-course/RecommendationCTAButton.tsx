import type { ButtonHTMLAttributes, ReactNode } from "react";
import Button from "@/components/common/Button/Button";
import { cn } from "@/utils/cn";

interface RecommendationCTAButtonProps extends Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled"
> {
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
  disabled,
}: RecommendationCTAButtonProps) {
  return (
    <Button
      variant="primary"
      fullWidth
      disabled={disabled}
      className={cn("max-w-x80 gap-x2 disabled:pointer-events-none disabled:opacity-40", className)}
      onClick={onClick}
    >
      {icon ? <span className="flex items-center justify-center">{icon}</span> : null}
      {children}
    </Button>
  );
}
