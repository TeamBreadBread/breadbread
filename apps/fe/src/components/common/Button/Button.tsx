import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-gray-800 text-gray-00",
  secondary: "bg-gray-300 text-gray-1000",
};

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "font-sans text-size-6 leading-t6 font-bold tracking-2 flex h-x14 items-center justify-center rounded-r3 px-x5 py-x4 transition-colors",
        variantClassName[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
