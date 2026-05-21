import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { SectionHeader } from "@/components/common";

interface PreferenceQuestionSectionProps {
  title: string;
  helperText?: string;
  columns?: 1 | 2 | 5;
  /** true면 자식을 그리드 없이 가로 100% 너비로 배치 (스테퍼 등) */
  fullWidthChild?: boolean;
  /** 제목 왼쪽 아이콘 (미지정 시 SectionHeader 기본 원) */
  icon?: ReactNode;
  children: ReactNode;
}

export default function PreferenceQuestionSection({
  title,
  helperText = "중복 가능",
  columns = 2,
  icon,
  fullWidthChild = false,
  children,
}: PreferenceQuestionSectionProps) {
  const gridColumnClass =
    columns === 1 ? "grid-cols-1" : columns === 5 ? "grid-cols-5" : "grid-cols-2";

  return (
    <section className="flex w-full flex-col items-stretch gap-x4 overflow-hidden bg-gray-00 p-x5">
      <SectionHeader title={title} rightText={helperText} icon={icon} />
      {fullWidthChild ? (
        <div className="w-full min-w-0">{children}</div>
      ) : (
        <div className={cn("grid w-full min-w-0 gap-x4 gap-y4", gridColumnClass)}>{children}</div>
      )}
    </section>
  );
}
