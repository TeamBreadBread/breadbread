import type { ReactNode } from "react";
import { FieldLabel, HelperText } from "@/components/common";

interface SignupSectionProps {
  label: string;
  children: ReactNode;
  helperText?: ReactNode;
  helperTextClassName?: string;
}

export default function SignupSection({
  label,
  children,
  helperText,
  helperTextClassName,
}: SignupSectionProps) {
  return (
    <section className="flex flex-col gap-x1-5">
      <FieldLabel>{label}</FieldLabel>
      {children}
      {helperText ? <HelperText className={helperTextClassName}>{helperText}</HelperText> : null}
    </section>
  );
}
