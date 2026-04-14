import type { ReactNode } from "react";

interface FieldLabelProps {
  children: ReactNode;
}

export default function FieldLabel({ children }: FieldLabelProps) {
  return <label className="font-pretendard typo-t4medium text-gray-800">{children}</label>;
}
