import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { SectionHeader } from "@/components/common";

interface PreferenceQuestionSectionProps {
  title: string;
  helperText?: string;
  columns?: 1 | 2 | 5;
  /** 제목 왼쪽 아이콘 (미지정 시 SectionHeader 기본 원) */
  icon?: ReactNode;
  children: ReactNode;
}

export default function PreferenceQuestionSection({
  title,
  helperText = "중복 가능",
  columns = 2,
  icon,
  children,
}: PreferenceQuestionSectionProps) {
  const gridColumnClass =
    columns === 1 ? "grid-cols-1" : columns === 5 ? "grid-cols-5" : "grid-cols-2";

  return (
    <section className="flex flex-col items-center gap-x4 overflow-hidden bg-gray-00 p-x5">
      <SectionHeader title={title} rightText={helperText} icon={icon} />
      <div className={cn("grid w-full gap-x4 gap-y4", gridColumnClass)}>{children}</div>
    </section>
  );
}
