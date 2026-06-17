import { useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

type AiCourseRecommendReasonPanelProps = {
  reason: string;
};

export default function AiCourseRecommendReasonPanel({
  reason,
}: AiCourseRecommendReasonPanelProps) {
  const [open, setOpen] = useState(false);
  const trimmed = reason.trim();
  if (!trimmed) return null;

  return (
    <div className="mt-x3 w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-center gap-x1 rounded-r2 bg-[#f3f4f5] px-x4 py-x3",
          "font-pretendard typo-t4medium text-[#2a3038]",
        )}
      >
        <AppIcon
          src={open ? IconAssets.IcChevronUp : IconAssets.IcChevronDown}
          size="x3"
          className="icon-gray-600 shrink-0"
        />
        AI 코스 추천 이유 보기
      </button>
      {open ? (
        <p className="mt-x2 whitespace-pre-wrap px-x1 font-pretendard typo-t4regular leading-t5 text-[#555d6d]">
          {trimmed}
        </p>
      ) : null}
    </div>
  );
}
